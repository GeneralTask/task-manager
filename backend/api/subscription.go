package api

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/GeneralTask/task-manager/backend/config"
	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/GeneralTask/task-manager/backend/logging"
	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	billingportalsession "github.com/stripe/stripe-go/v76/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/webhook"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	SubscriptionStatusActive   = "active"
	SubscriptionStatusTrialing = "trialing"
)

func init() {
	stripe.Key = config.GetConfigValue("STRIPE_SECRET_KEY")
}

// SubscriptionStatus godoc
// @Summary      Returns the user's subscription status
// @Description  Returns subscription status, plan, and expiry
// @Tags         subscription
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} string "internal server error"
// @Router       /subscriptions/status/ [get]
func (api *API) SubscriptionStatus(c *gin.Context) {
	userID := getUserIDFromContext(c)
	userCollection := database.GetUserCollection(api.DB)
	var userObject database.User
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		api.Logger.Error().Err(err).Msg("failed to find user for subscription status")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{
		"subscription_status":             userObject.SubscriptionStatus,
		"subscription_id":                 userObject.SubscriptionID,
		"subscription_price_id":           userObject.SubscriptionPriceID,
		"subscription_current_period_end": userObject.SubscriptionCurrentPeriodEnd,
		"is_subscribed":                   isUserSubscribed(&userObject),
	})
}

// CreateCheckoutSession godoc
// @Summary      Creates a Stripe Checkout session for subscribing
// @Description  Returns the checkout URL to redirect the user to
// @Tags         subscription
// @Success      200 {object} map[string]string
// @Failure      500 {object} string "internal server error"
// @Router       /subscriptions/create-checkout-session/ [post]
func (api *API) CreateCheckoutSession(c *gin.Context) {
	logger := logging.GetSentryLogger()

	userID := getUserIDFromContext(c)
	userCollection := database.GetUserCollection(api.DB)
	var userObject database.User
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		logger.Error().Err(err).Msg("failed to find user for checkout session")
		Handle500(c)
		return
	}

	// Create or retrieve Stripe customer
	stripeCustomerID, err := getOrCreateStripeCustomer(api, &userObject)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create/retrieve stripe customer")
		Handle500(c)
		return
	}

	priceID := config.GetConfigValue("STRIPE_PRICE_ID")
	homeURL := config.GetConfigValue("HOME_URL")

	params := &stripe.CheckoutSessionParams{
		Customer: stripe.String(stripeCustomerID),
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL:            stripe.String(homeURL + "?subscription=success"),
		CancelURL:             stripe.String(homeURL + "?subscription=canceled"),
		AllowPromotionCodes:   stripe.Bool(true),
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			TrialPeriodDays: stripe.Int64(14),
		},
	}

	session, err := checkoutsession.New(params)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create checkout session")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{"checkout_url": session.URL})
}

// CreatePortalSession godoc
// @Summary      Creates a Stripe Customer Portal session
// @Description  Returns the portal URL to redirect the user to manage their subscription
// @Tags         subscription
// @Success      200 {object} map[string]string
// @Failure      500 {object} string "internal server error"
// @Router       /subscriptions/create-portal-session/ [post]
func (api *API) CreatePortalSession(c *gin.Context) {
	logger := logging.GetSentryLogger()

	userID := getUserIDFromContext(c)
	userCollection := database.GetUserCollection(api.DB)
	var userObject database.User
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&userObject)
	if err != nil {
		logger.Error().Err(err).Msg("failed to find user for portal session")
		Handle500(c)
		return
	}

	if userObject.StripeCustomerID == "" {
		c.JSON(400, gin.H{"detail": "no stripe customer found for this user"})
		return
	}

	homeURL := config.GetConfigValue("HOME_URL")
	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(userObject.StripeCustomerID),
		ReturnURL: stripe.String(homeURL),
	}

	session, err := billingportalsession.New(params)
	if err != nil {
		logger.Error().Err(err).Msg("failed to create portal session")
		Handle500(c)
		return
	}

	c.JSON(200, gin.H{"portal_url": session.URL})
}

// StripeWebhook godoc
// @Summary      Handles Stripe webhook events
// @Description  Processes subscription lifecycle events from Stripe
// @Tags         subscription
// @Success      200 {object} string
// @Failure      400 {object} string "bad request"
// @Router       /subscriptions/webhook/ [post]
func (api *API) StripeWebhook(c *gin.Context) {
	logger := logging.GetSentryLogger()

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.Error().Err(err).Msg("failed to read webhook body")
		c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to read body"})
		return
	}

	webhookSecret := config.GetConfigValue("STRIPE_WEBHOOK_SECRET")
	event, err := webhook.ConstructEvent(body, c.Request.Header.Get("Stripe-Signature"), webhookSecret)
	if err != nil {
		logger.Error().Err(err).Msg("failed to verify webhook signature")
		c.JSON(http.StatusBadRequest, gin.H{"detail": "invalid signature"})
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &session)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal checkout session")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		if session.Subscription != nil {
			err = updateUserSubscription(api, session.Customer.ID, session.Subscription.ID, "active")
			if err != nil {
				logger.Error().Err(err).Msg("failed to update subscription after checkout")
			}
		}

	case "customer.subscription.updated":
		var subscription stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &subscription)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal subscription update")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		priceID := ""
		if len(subscription.Items.Data) > 0 {
			priceID = subscription.Items.Data[0].Price.ID
		}
		periodEnd := primitive.NewDateTimeFromTime(time.Unix(subscription.CurrentPeriodEnd, 0))
		err = updateUserSubscriptionFull(api, subscription.Customer.ID, subscription.ID, string(subscription.Status), priceID, periodEnd)
		if err != nil {
			logger.Error().Err(err).Msg("failed to update subscription")
		}

	case "customer.subscription.deleted":
		var subscription stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &subscription)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal subscription deletion")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		err = updateUserSubscription(api, subscription.Customer.ID, subscription.ID, "canceled")
		if err != nil {
			logger.Error().Err(err).Msg("failed to update subscription after deletion")
		}

	case "invoice.payment_failed":
		var invoice stripe.Invoice
		err := json.Unmarshal(event.Data.Raw, &invoice)
		if err != nil {
			logger.Error().Err(err).Msg("failed to unmarshal invoice")
			c.JSON(http.StatusBadRequest, gin.H{"detail": "failed to parse event"})
			return
		}
		if invoice.Subscription != nil {
			err = updateUserSubscription(api, invoice.Customer.ID, invoice.Subscription.ID, "past_due")
			if err != nil {
				logger.Error().Err(err).Msg("failed to update subscription after payment failure")
			}
		}
	}

	c.JSON(200, gin.H{"received": true})
}

// getOrCreateStripeCustomer ensures the user has a Stripe customer record
func getOrCreateStripeCustomer(api *API, user *database.User) (string, error) {
	if user.StripeCustomerID != "" {
		return user.StripeCustomerID, nil
	}
	params := &stripe.CustomerParams{
		Email: stripe.String(user.Email),
		Name:  stripe.String(user.Name),
	}
	params.AddMetadata("general_task_user_id", user.ID.Hex())

	cust, err := customer.New(params)
	if err != nil {
		return "", err
	}

	userCollection := database.GetUserCollection(api.DB)
	_, err = userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"stripe_customer_id": cust.ID}},
	)
	if err != nil {
		return "", err
	}

	return cust.ID, nil
}

// updateUserSubscription updates basic subscription status by Stripe customer ID
func updateUserSubscription(api *API, stripeCustomerID string, subscriptionID string, status string) error {
	userCollection := database.GetUserCollection(api.DB)
	_, err := userCollection.UpdateOne(
		context.Background(),
		bson.M{"stripe_customer_id": stripeCustomerID},
		bson.M{"$set": bson.M{
			"subscription_id":     subscriptionID,
			"subscription_status": status,
		}},
	)
	return err
}

// updateUserSubscriptionFull updates all subscription fields by Stripe customer ID
func updateUserSubscriptionFull(api *API, stripeCustomerID string, subscriptionID string, status string, priceID string, periodEnd primitive.DateTime) error {
	userCollection := database.GetUserCollection(api.DB)
	_, err := userCollection.UpdateOne(
		context.Background(),
		bson.M{"stripe_customer_id": stripeCustomerID},
		bson.M{"$set": bson.M{
			"subscription_id":                 subscriptionID,
			"subscription_status":             status,
			"subscription_price_id":           priceID,
			"subscription_current_period_end": periodEnd,
		}},
	)
	return err
}

// isUserSubscribed checks if a user has an active or trialing subscription
func isUserSubscribed(user *database.User) bool {
	return user.SubscriptionStatus == "active" || user.SubscriptionStatus == "trialing"
}
