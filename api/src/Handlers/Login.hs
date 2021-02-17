{-# LANGUAGE TemplateHaskell #-}
-- | Login Handlers, using Google's OpenApi

module Handlers.Login where


import qualified Crypto.JWT               as J
import           Data.Aeson
import           Database.Model
import           Database.Persist         (Entity (entityKey),
                                           PersistStoreWrite (insertKey),
                                           PersistUniqueRead (getBy),
                                           insertEntity)
import           ExternalApi.Google.OAuth
import           Handlers.Type            (App, AppT, Config (httpManager), log)
import           Lens.Micro
import           Network.OAuth.OAuth2     (ExchangeToken (..),
                                           IdToken (IdToken),
                                           OAuth2 (oauthClientId),
                                           OAuth2Token (idToken),
                                           fetchAccessToken, fetchAccessToken2)
import           Network.URI              (relativeTo, uriToString)
import           Network.URI.Static       (uri)
import           Relude
import           Relude.Extra.Map
import           Servant
import           Servant.API
import           Servant.Auth
import           Servant.Auth.Server
import           Servant.HTML.Blaze       (HTML)
import           Settings                 (GoogleSettings (GoogleSettings),
                                           googleJwk, googleSettings)
import qualified Text.Blaze.Html5         as H
import           Text.Hamlet              (shamletFile)

type LoginAPI =
  "login" :> Get '[HTML] H.Html
  :<|>
  "oauth2" :> ReqBody '[JSON] ExchangeToken
  :> Verb 'POST 204 '[JSON] (Headers '[ Header "Set-Cookie" SetCookie
                                      , Header "Set-Cookie" SetCookie]
                             NoContent)

loginServer
  :: (MonadIO m)
  => CookieSettings -- We need these to set token.
  -> JWTSettings
  -> ServerT LoginAPI (AppT m)
loginServer cs jwts = getLogin :<|> getOAuth2 cs jwts

-- | Handler to display login information, in this mockup we simply return a
-- button to log in with, but in the future, we'd want to expand this into a
-- full fledged html file. It's worth considering though, that this aspect of
-- the application, namely the login and authentication step, should be distinct
-- from the react application, both for security and ease of implementation.
getLogin :: (MonadIO m) => AppT m H.Html
getLogin =
  let GoogleSettings oauth = googleSettings
      oauth_client_id = oauthClientId oauth
  in return $(shamletFile "templates/login.hamlet")

-- | Authorize the incoming OAuth request that spawns after a "Login" Event. We
-- then create, or log in an existing user, saving them to the database, and
-- then post the necessary cookies for session authorization
getOAuth2
  :: (MonadIO m)
  => CookieSettings
  -> JWTSettings
  -> ExchangeToken
  -> AppT m (Headers '[ Header "Set-Cookie" SetCookie
                      , Header "Set-Cookie" SetCookie]
                      NoContent)
getOAuth2 cookieSet jwtSet extoken' = do
  manager <- asks httpManager
  mtoken <- liftIO $ fetchAccessToken2 manager (coerce googleSettings) extoken'

  token <- case mtoken of
             Right token -> return token
             Left err    -> log ("Error retreiving token " <> show err) >> throwError err500

  -- The token contains an id_token with user details. We need to parse this to
  -- get the user identifier.
  user <- liftIO (getUserDetailsFromToken token) >>= \case
    Just u  -> return u
    Nothing -> do log $ "Incorrect id_token format : " <> show token
                  throwError err400

  -- Check if the user already exists in the database
  mb_db_user <- runDb $ getBy $ UniqueIdentifier (userIdentifier user)

  -- Either return the details of this user, or insert the new user into the database.
  user_id <- case mb_db_user of
    Just userEntity -> do log $ "Logging in user " <> show (userFullName user)
                          return $ entityKey userEntity
    Nothing         -> do log $ "Inserting user " <> show (userFullName user)
                          fmap entityKey . runDb $ insertEntity user

  -- Set JWT auth with user id.
  log $ "Persisting " <> show user_id <> " " <> show cookieSet
  mApplyCookies <- liftIO $ acceptLogin cookieSet jwtSet user_id
  case mApplyCookies of
    Nothing           -> throwError err401
    Just applyCookies -> return $ applyCookies NoContent



-- | When we get an OAuth2Token from google, it contains an id section which is
-- a JWT containing user information needed for logging our user in. This
-- function extracts that information and returns a user with all fields filled
-- in except the googleToken
getUserDetailsFromToken ::  OAuth2Token -> IO (Maybe  User)
getUserDetailsFromToken token = runMaybeT $ do
  -- extract the IdToken from it's wrapped Maybe value.
  (IdToken idToken') <- hoistMaybe $ idToken token

  -- Parse (and verify) the JWT, for more info see:
  -- https://hackage.haskell.org/package/jose-0.8.4/docs/Crypto-JWT.html
  --
  -- The JWT standard insists we verify the audience of our token, in this case
  -- this is given by the scopes we defined to access the google API. The
  -- audience may be either a string or URI, so we use @J.StringOrURI@ types
  -- prism in order to extract it from a string.
  aud <- hoistMaybe $ oauthClientId (coerce googleSettings) ^? J.stringOrUri
  claims <- exceptToMaybeT $ decodeClaims idToken' aud

  -- Decode the payload as a user
  MaybeT $ return $ userFromClaims claims
  where
    -- Decode claims via the @J.verifyClaims@ Method

    userFromClaims :: J.ClaimsSet -> Maybe User
    userFromClaims claims = do
      -- The unique identifier of the given user, this value should be a
      -- a stirng, and we use the @Prism@ provided by @J.string@ to extract that
      -- aspect of the value.
      claimsSub <- claims ^. J.claimSub
      identifier <- claimsSub ^? J.string

      -- The other claims provided by goolge are vendor specific, and presnet in
      -- the form of a HashMap.
      let m = claims ^. J.unregisteredClaims
      String name <- lookup "name" m
      String email <- lookup "email" m
      return $ User { userGoogleToken = token
                    , userIdentifier  = identifier
                    , userEmail = email
                    , userFullName = name }

decodeClaims :: Text -> J.StringOrURI -> ExceptT J.JWTError IO J.ClaimsSet
decodeClaims token aud = do
  jwt <- J.decodeCompact $ encodeUtf8 token
  J.verifyClaims (J.defaultJWTValidationSettings (== aud)) googleJwk jwt

------------------------
-- Convenience Functions
-----------------------

-- | Convenience function, render a link, with a root url.
linkToString :: Link -> Text -> Text
linkToString link base = base <> toText (uriToString id (linkURI link) "")

-- | Redirect to a different url
redirects :: (MonadIO m, ConvertUtf8 s ByteString) => s -> AppT m ()
redirects url = throwError err302 { errHeaders = [("Location",  encodeUtf8 url)]}
