{-# LANGUAGE TemplateHaskell #-}
-- | Login Handlers, using Google's OpenApi

module Handlers.Login where


import           Data.Aeson
import           Database.Model
import           Database.Persist     (Entity, PersistUniqueRead (getBy),
                                       insertEntity)
import           Handlers.Type        (App, AppT, Config (httpManager), log)
import qualified Jose.Jwa             as J
import qualified Jose.Jwe             as J
import qualified Jose.Jwt             as J
import           Network.OAuth.OAuth2 (ExchangeToken, IdToken (IdToken),
                                       OAuth2 (oauthClientId),
                                       OAuth2Token (idToken), fetchAccessToken,
                                       fetchAccessToken2)
import           Relude
import           Relude.Extra.Map
import           Servant
import           Servant.API
import           Servant.HTML.Blaze   (HTML)
import           Settings             (GoogleSettings (GoogleSettings),
                                       googleJwk, googleSettings)
import qualified Text.Blaze.Html5     as H
import           Text.Hamlet          (shamletFile)

type LoginApi =
  "login" :> Get '[HTML] H.Html :<|>
  "login" :> "authorize" :> ReqBody '[JSON] ExchangeToken :> Post '[JSON] (Entity User)

-- | Handler to display login information, in this mockup we simply return a
-- button to log in with, but in the future, we'd want to expand this into a
-- full fledged html file. It's worth considering though, that this aspect of
-- the application, namely the login and authentication step, should be distinct
-- from the react application, both for security and ease of implementation.
getLogin :: (MonadIO m) => AppT m H.Html
getLogin = let oauth_client_id = oauthClientId $ coerce googleSettings
            in return $(shamletFile "templates/login.hamlet")

-- | Authorize the incoming OAuth request that spawns after a "Login" Event.
postAuthorize :: (MonadIO m) => ExchangeToken -> AppT m (Entity User)
postAuthorize extoken' = do
  manager <- asks httpManager
  mtoken <- liftIO $ fetchAccessToken2 manager (coerce googleSettings) extoken'

  token <- case mtoken of
             Right token -> return token
             Left _      -> throwError err500

  -- The token contains an id_token with user details. We need to parse this to
  -- get the user identifier.
  user <- liftIO (getUserDetailsFromToken token) >>= \case
    Just u  -> return u
    Nothing -> do log $ "Incorrect id_token format : " <> show token
                  throwError err400

  -- Check if the user already exists in the database
  mb_db_user <- runDb $ getBy $ UniqueIdentifier (userIdentifier user)

  -- Either return the details of this user, or insert the new user into the database.
  case mb_db_user of
    Just userEntity -> do log $ "Logging in user " <> show (userFullName user)
                          return userEntity
    Nothing         -> do log $ "Inserting user " <> show (userFullName user)
                          runDb $ insertEntity user



-- | When we get an OAuth2Token from google, it contains an id section which is
-- a JWT containing user information needed for logging our user in. This
-- function extracts that information and returns a user with all fields filled
-- in except the googleToken
getUserDetailsFromToken ::  OAuth2Token -> IO (Maybe User)
getUserDetailsFromToken token = runMaybeT $ do
  -- extract the IdToken from it's wrapped Maybe value.
  (IdToken idToken') <- MaybeT $ return $ idToken token

  -- Parse (and verify) the JWT, for more info see:
  -- https://hackage.haskell.org/package/jose-jwt-0.9.0/docs/Jose-Jwt.html
  --
  -- Because MaybeT implements MonadFail, we can perform this non exhaustive
  -- pattern match.
  Right (J.Jws (_, payload)) <- liftIO $
    J.decode [googleJwk] (Just $ J.JwsEncoding J.RS256) (encodeUtf8 idToken')

  -- Decode the payload as a user
  MaybeT $ return $ decodeStrict payload >>= userFromPayload
  where
    userFromPayload :: Object -> Maybe User
    userFromPayload m = do
      String identifier <- lookup "sub" m
      String name <- lookup "name" m
      String email <- lookup "email" m
      return $ User { userGoogleToken = token
                    , userIdentifier  = identifier
                    , userEmail = email
                    , userFullName = name }
