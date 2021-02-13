-- | Central repository for our Servant based API.

module Api where

import Handlers.Login ( LoginApi, getLogin, postAuthorize )
import Handlers.Type ( AppT, Config, appToHandler )
import Relude
import Servant
    ( hoistServer,
      serve,
      serveDirectoryFileServer,
      type (:<|>)(..),
      Raw,
      type (:>),
      HasServer(ServerT),
      Server,
      Application )
import Servant.Server ()


------------------------------
-- Top Level API Specification
------------------------------

-- | The API for the application. This is strongly typed, and hence can be used
-- to generate swagger specifications as well as ensure routing via type.
type API = LoginApi


-- | The implementation of the above API.
appServer :: (MonadIO m) => ServerT API (AppT m)
appServer = getLogin :<|> postAuthorize

-- | The API for the application, AND, the static files located in /static,
-- identified by @Raw@. We define this as an addendum to the @API@ since static
-- files should always be the last pattern searched.
type APIWStatic = API :<|> "static" :> Raw

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

-- | Convert application to @Server@, to run against Warp.
appToServer :: Config -> Server API
appToServer conf = hoistServer (Proxy @API) (appToHandler conf) appServer


-- | Our application becomes a WAI application which can be run by the
-- blindingly fast Warp Server.
app :: Config -> Application
app cfg = serve (Proxy @APIWStatic) (appToServer cfg :<|> files)
