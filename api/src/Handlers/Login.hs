{-# LANGUAGE TemplateHaskell #-}
-- | Login Handlers, using Google's OpenApi

module Handlers.Login where

import Database.Model
    ( Unique(UniqueIdentifier), User(User), runDb )
import Database.Persist
    ( insertEntity, Entity, PersistUniqueRead(getBy) )
import Handlers.Type ( Config(httpManager), AppT )
import Network.OAuth.OAuth2
    ( fetchAccessToken,
      ExchangeToken,
      IdToken(IdToken),
      OAuth2(oauthClientId),
      OAuth2Token(idToken) )
import           Relude
import Servant
    ( err500, throwError, type (:<|>), JSON, ReqBody, type (:>), Get )
import Servant.HTML.Blaze ( HTML )
import Settings ( GoogleSettings(GoogleSettings), googleSettings )
import qualified Text.Blaze.Html5     as H
import Text.Hamlet ( shamletFile )


type LoginApi =
  "login" :> Get '[HTML] H.Html :<|>
  "login" :> "authorize" :> ReqBody '[JSON] ExchangeToken :> Get '[JSON] (Entity User)

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
  mtoken <- liftIO $ fetchAccessToken manager (coerce googleSettings) extoken'

  token <- case mtoken of
             Right token -> return token
             Left _      -> throwError err500

  -- Look for a user with the correct id token
  let Just (IdToken identifier) = idToken token
  muser <- runDb $ getBy $ UniqueIdentifier identifier

  -- Either return the details of this user, or insert the new user into the database.
  case muser of
    Just userEntity -> return userEntity
    Nothing         -> runDb $ insertEntity (User token identifier)
