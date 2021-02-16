-- | Define an external API for accessing Google Mail (GMail). This could be
-- viewed as a rather minimalist client for GMail, though with some strong
-- typing and guarantees.
--
-- This minimalist is intentional, compiling up-teen libraries for external
-- API's is not a sustainable approach, and will create dependency hell, since
-- it is only ever one or two API's we will be querying.

module ExternalApi.Google.Mail where

import           Data.Aeson
import qualified Data.ByteString.Base64 as Base64
import           Data.Time
import           Handlers.Type
import           Network.OAuth.OAuth2
import           Relude
import           Servant.API
import           Servant.Auth
import           Servant.Auth.Client
import           Servant.Auth.JWT
import           Servant.Client

-- Define generic types for accessing the google api, these correspond
-- injectively to the documentation found here:
--
--   https://developers.google.com/gmail/api
--
-- They are "injective" because certain options made available by the Google API
-- are superfluous to our application, but can be added later if the need
-- requires it.

data GmailUser = GmailUserMe | GmailUserEmail Text
  deriving (Eq, Show)

instance ToHttpApiData GmailUser where
  toUrlPiece GmailUserMe        = "me"
  toUrlPiece (GmailUserEmail e) = e

-- | The following is adopted, but distinct, from the documentation found in:
-- [https://developers.google.com/gmail/api/reference/rest/v1/users.messages#Message](the
-- google documentation). For instance, we parse the message body directly, nd
-- dispense with several fields such as the mime type, and attacked files.
data GmailMessage = GmailMessage
  { gmail_message_id           :: Text
  , gmail_message_threadId     :: Text
  , gmail_message_labelIds     :: [Text]
  , gmail_message_snippet      :: Text
  , gmail_message_payloadBody  :: ByteString
  , gmail_message_internalDate :: UTCTime
  } deriving (Show, Eq)

instance FromJSON GmailMessage where
  parseJSON = withObject "gmail_message" $ \o -> do
    mId <- o .: "id"
    threadId <- o .: "threadId"
    labelIds <- o .: "labelIds"
    snippet <- o .: "snippet"

    -- The payload body is nested within several layers. Since nothing in those
    -- layers in particularly interesting, we leave them alone and extract only
    -- the piece we want to avoid tedious nesting in client code.
    (payloadBodyBase64 :: Text) <- do payload <- o .: "payload"
                                      body <- payload .: "body"
                                      body .: "data"
    internalDate <- o .: "internalDate"

    -- the body of a message is base64 encoded, and as such needs to be decoded.
    payloadBody <- either (\ _ -> fail "Could not decode payload body") pure $
      Base64.decode (encodeUtf8 payloadBodyBase64)

    return $ GmailMessage mId threadId labelIds snippet payloadBody internalDate


data GmailMessageList = GmailMessageList
  { gmail_messasge_list :: [GmailMessage] }
  deriving (Show, Eq)

instance FromJSON GmailMessageList where
  parseJSON = withObject "gmail message list" $ \o ->
    GmailMessageList <$> o .: "messages"


-- Derived from: https://developers.google.com/gmail/api
type GmailAPI =
  Auth '[Bearer] () :> -- Authentication
  "gmail" :> "v1" :> "users" :> Capture "user-id" GmailUser :> "messages" :>
  Get '[JSON] GmailMessageList
  -- ^ List all messages
  -- https://gmail.googleapis.com/gmail/v1/users/{userId}/messages

-- | The accessors for the Gmail API, since servant can deduce what a client
-- function should do based on the type signature of @GmailAPI@ we don't write
-- this ourselves
getGmailMessages :: Token -> GmailUser -> ClientM GmailMessageList
getGmailMessages = client $ Proxy @GmailAPI


-- | Wrapper that sets the base url to run a google api. This should be
-- extracted to another function
--
-- TODO: Wrap a renewal reuqest of the OAuthToken into this method.
runGmailApi
  :: ( MonadIO m )
  => ClientM a
  -> AppT m (Either ClientError a)
runGmailApi f = do
  -- Grab our TLS http manaer
  manager <- asks httpManager

  -- Set the google base url
  let cliEnv = mkClientEnv manager (BaseUrl Https "gmail.googleapis.com" 443 "")

  -- Run the client
  liftIO $ runClientM f cliEnv
