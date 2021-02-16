-- | Central repository for our Servant based API.

module Api where

import           Database.Model      (UserId)
import           Handlers.Login      (LoginApi, getLogin, postAuthorize)
import           Handlers.Tasks      (TasksAPI, getRefreshHtml, getTaskList)
import           Handlers.Type
import           Relude
import           Servant
import           Servant.Auth
import           Servant.Auth.Server (AuthResult (Authenticated),
                                      CookieSettings, JWTSettings,
                                      ThrowAll (throwAll))


------------------------------
-- Top Level API Specification
------------------------------

-- |The public API consists of the login endpoints, and any static files that
-- should be served as well
type PublicAPI = LoginApi

-- | The implementation of the @PublicAPI@.
publicServer
  :: (MonadIO m)
  => CookieSettings -- We need these to set token.
  -> JWTSettings
  -> ServerT PublicAPI (AppT m)
publicServer cs jwts = getLogin :<|> postAuthorize cs jwts


type PrivateAPI = TasksAPI

-- | The private API is protected by an authentication scheme. Code is adapted
-- from:
--   https://github.com/haskell-servant/servant-auth#readme
protectedServer
  :: (MonadIO m)
  => AuthResult UserId
  -> ServerT PrivateAPI (AppT m)
protectedServer (Authenticated userId) =
  getTaskList userId :<|> getRefreshHtml userId
protectedServer _ = throwAll err401



-- | The API for the application. This is strongly typed, and hence can be used
-- to generate swagger specifications as well as ensure routing via type.
type API auths = (Auth auths UserId :> PrivateAPI) :<|> PublicAPI


server :: CookieSettings -> JWTSettings -> ServerT (API auths) App
server cs jwts = protectedServer :<|> publicServer cs jwts

---------------
-- Static Files
---------------

-- | Serve the local static directory. Since Servant, while capable of, is not
-- particularly suitable for serving static assets like JavaScript, images,
-- etc.. we serve these statically to give us some measure of a front end.
--
-- TODO: Eventually, when this app becomes an API only, this will no longer be
-- necessary and these files should instead be served directly from a CDN.
files :: Server Raw
files = serveDirectoryFileServer "static"

----------------------
-- Serve API Over Warp
----------------------

type APIWStatic auths = API auths

apiWStatic :: Proxy (APIWStatic '[JWT])
apiWStatic = Proxy

type APIAuths = '[JWT]

type AppCtx = '[CookieSettings, JWTSettings]


-- | Our application becomes a WAI application which can be run by the
-- blindingly fast Warp Server.
app :: Context '[CookieSettings, JWTSettings] -> CookieSettings -> JWTSettings -> Config -> Application
app ctx cookieSet jwtSet cfg =
  serveWithContext apiWStatic ctx $
    hoistServerWithContext apiWStatic (Proxy @AppCtx) (appToHandler cfg) (server cookieSet jwtSet)
