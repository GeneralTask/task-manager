package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/GeneralTask/task-manager/backend/database"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestIsUserSubscribed(t *testing.T) {
	t.Run("ActiveSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "active"}
		assert.True(t, isUserSubscribed(user))
	})
	t.Run("TrialingSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "trialing"}
		assert.True(t, isUserSubscribed(user))
	})
	t.Run("CanceledSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "canceled"}
		assert.False(t, isUserSubscribed(user))
	})
	t.Run("PastDueSubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "past_due"}
		assert.False(t, isUserSubscribed(user))
	})
	t.Run("EmptySubscription", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: ""}
		assert.False(t, isUserSubscribed(user))
	})
	t.Run("RandomStatus", func(t *testing.T) {
		user := &database.User{SubscriptionStatus: "unknown_status"}
		assert.False(t, isUserSubscribed(user))
	})
}

func TestSubscriptionStatusEndpoint(t *testing.T) {
	authToken := login("subscription_status_test@generaltask.com", "")
	UnauthorizedTest(t, "GET", "/subscriptions/status/", nil)

	t.Run("NoSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "", result["subscription_status"])
		assert.Equal(t, false, result["is_subscribed"])
	})

	t.Run("ActiveSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"subscription_status":   "active",
				"subscription_id":       "sub_test123",
				"subscription_price_id": "price_test123",
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "active", result["subscription_status"])
		assert.Equal(t, "sub_test123", result["subscription_id"])
		assert.Equal(t, "price_test123", result["subscription_price_id"])
		assert.Equal(t, true, result["is_subscribed"])
	})

	t.Run("TrialingSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"subscription_status": "trialing",
				"subscription_id":     "sub_trial456",
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "trialing", result["subscription_status"])
		assert.Equal(t, true, result["is_subscribed"])
	})

	t.Run("CanceledSubscription", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		userID := getUserIDFromAuthToken(t, api.DB, authToken)
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"subscription_status": "canceled",
			}},
		)
		assert.NoError(t, err)

		router := GetRouter(api)
		request, _ := http.NewRequest("GET", "/subscriptions/status/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusOK, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)

		var result map[string]interface{}
		err = json.Unmarshal(body, &result)
		assert.NoError(t, err)
		assert.Equal(t, "canceled", result["subscription_status"])
		assert.Equal(t, false, result["is_subscribed"])
	})
}

func TestCreateCheckoutSessionEndpoint(t *testing.T) {
	UnauthorizedTest(t, "POST", "/subscriptions/create-checkout-session/", nil)
}

func TestCreatePortalSessionEndpoint(t *testing.T) {
	authToken := login("portal_session_test@generaltask.com", "")
	UnauthorizedTest(t, "POST", "/subscriptions/create-portal-session/", nil)

	t.Run("NoStripeCustomer", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		request, _ := http.NewRequest("POST", "/subscriptions/create-portal-session/", nil)
		request.Header.Add("Authorization", "Bearer "+authToken)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"no stripe customer found for this user\"}", string(body))
	})
}

func TestStripeWebhookEndpoint(t *testing.T) {
	t.Run("EmptyBody", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		request, _ := http.NewRequest("POST", "/subscriptions/webhook/", bytes.NewBuffer([]byte("")))
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid signature\"}", string(body))
	})

	t.Run("InvalidSignature", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()
		router := GetRouter(api)

		payload := []byte(`{"type": "checkout.session.completed"}`)
		request, _ := http.NewRequest("POST", "/subscriptions/webhook/", bytes.NewBuffer(payload))
		request.Header.Set("Stripe-Signature", "t=12345,v1=invalidsignature")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)

		assert.Equal(t, http.StatusBadRequest, recorder.Code)
		body, err := io.ReadAll(recorder.Body)
		assert.NoError(t, err)
		assert.Equal(t, "{\"detail\":\"invalid signature\"}", string(body))
	})
}

func TestUpdateUserSubscription(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_test@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		// Set up stripe customer ID on the user
		stripeCustomerID := "cus_test_update_sub"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{"stripe_customer_id": stripeCustomerID}},
		)
		assert.NoError(t, err)

		// Update subscription
		err = updateUserSubscription(api, stripeCustomerID, "sub_123", "active")
		assert.NoError(t, err)

		// Verify the update
		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_123", user.SubscriptionID)
		assert.Equal(t, "active", user.SubscriptionStatus)
	})

	t.Run("UpdateToCanceled", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_cancel@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_cancel"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":  stripeCustomerID,
				"subscription_status": "active",
				"subscription_id":     "sub_456",
			}},
		)
		assert.NoError(t, err)

		// Cancel subscription
		err = updateUserSubscription(api, stripeCustomerID, "sub_456", "canceled")
		assert.NoError(t, err)

		// Verify the update
		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_456", user.SubscriptionID)
		assert.Equal(t, "canceled", user.SubscriptionStatus)
		assert.False(t, isUserSubscribed(&user))
	})

	t.Run("UpdateToPastDue", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_pastdue@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_pastdue"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":  stripeCustomerID,
				"subscription_status": "active",
				"subscription_id":     "sub_789",
			}},
		)
		assert.NoError(t, err)

		err = updateUserSubscription(api, stripeCustomerID, "sub_789", "past_due")
		assert.NoError(t, err)

		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "past_due", user.SubscriptionStatus)
		assert.False(t, isUserSubscribed(&user))
	})
}

func TestUpdateUserSubscriptionFull(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_full@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_full_update"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{"stripe_customer_id": stripeCustomerID}},
		)
		assert.NoError(t, err)

		periodEnd := primitive.NewDateTimeFromTime(time.Date(2026, 4, 15, 0, 0, 0, 0, time.UTC))
		err = updateUserSubscriptionFull(api, stripeCustomerID, "sub_full_123", "active", "price_test_full", periodEnd)
		assert.NoError(t, err)

		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_full_123", user.SubscriptionID)
		assert.Equal(t, "active", user.SubscriptionStatus)
		assert.Equal(t, "price_test_full", user.SubscriptionPriceID)
		assert.Equal(t, periodEnd, user.SubscriptionCurrentPeriodEnd)
	})

	t.Run("UpdateAllFields", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		authToken := login("update_sub_full_all@generaltask.com", "")
		userID := getUserIDFromAuthToken(t, api.DB, authToken)

		stripeCustomerID := "cus_test_full_all"
		_, err := database.GetUserCollection(api.DB).UpdateOne(
			context.Background(),
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{
				"stripe_customer_id":            stripeCustomerID,
				"subscription_id":               "sub_old",
				"subscription_status":           "trialing",
				"subscription_price_id":         "price_old",
				"subscription_current_period_end": primitive.NewDateTimeFromTime(time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)),
			}},
		)
		assert.NoError(t, err)

		newPeriodEnd := primitive.NewDateTimeFromTime(time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC))
		err = updateUserSubscriptionFull(api, stripeCustomerID, "sub_new", "active", "price_new", newPeriodEnd)
		assert.NoError(t, err)

		var user database.User
		err = database.GetUserCollection(api.DB).FindOne(
			context.Background(),
			bson.M{"_id": userID},
		).Decode(&user)
		assert.NoError(t, err)
		assert.Equal(t, "sub_new", user.SubscriptionID)
		assert.Equal(t, "active", user.SubscriptionStatus)
		assert.Equal(t, "price_new", user.SubscriptionPriceID)
		assert.Equal(t, newPeriodEnd, user.SubscriptionCurrentPeriodEnd)
		assert.True(t, isUserSubscribed(&user))
	})
}

func TestGetOrCreateStripeCustomer(t *testing.T) {
	t.Run("ExistingCustomer", func(t *testing.T) {
		api, dbCleanup := GetAPIWithDBCleanup()
		defer dbCleanup()

		existingCustomerID := "cus_existing_12345"
		user := &database.User{
			ID:               primitive.NewObjectID(),
			Email:            "existing_customer@test.com",
			StripeCustomerID: existingCustomerID,
		}

		customerID, err := getOrCreateStripeCustomer(api, user)
		assert.NoError(t, err)
		assert.Equal(t, existingCustomerID, customerID)
	})
}

func TestSubscriptionConstants(t *testing.T) {
	assert.Equal(t, "active", SubscriptionStatusActive)
	assert.Equal(t, "trialing", SubscriptionStatusTrialing)
}
