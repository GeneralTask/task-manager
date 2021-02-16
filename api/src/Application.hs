-- | The file responsible for running the actual application. This exports all
-- of one function, which runs the entire application. Since the application is
-- running on the Warp server, that function is named after a famous quote from
-- ST
--
--   "Engage!"
--     -- Jean-Luc Picard

module Application (engage) where

import           Api                                  (app)
import           Control.Monad.Logger                 (runStdoutLoggingT)
import           Database.Model                       (migrateAll)
import           Database.Persist.Sqlite              (createSqlitePool,
                                                       runMigration, runSqlPool)
import           Handlers.Type                        (Config (Config))
import           Network.HTTP.Client
import           Network.HTTP.Client.TLS
import qualified Network.Wai.Handler.Warp             as Warp
import           Network.Wai.Middleware.RequestLogger (logStdoutDev)
import           Relude
import           Say                                  (say)
import           Servant
import           Servant.Auth.Server
import           System.Log.FastLogger                (LogType' (LogStdout),
                                                       defaultBufSize,
                                                       newFastLogger)


engage :: IO ()
engage = withConfig $ \ config -> do

  -- Currently these are hard coded, but obviously they will become dynamic as we
  -- move along
  let warpSettings = Warp.setPort 3000 Warp.defaultSettings

  say "Setting up JWT authentication."
  --  Settings for our internal JWT based token authentication. Here we use a
  -- random Public Key for development purposes, obviously in an actual
  -- application, this would be shared across all applications, and persisted in
  -- some kind of permanent part of a blackboxed repo.
  key <- generateKey
  let jwtCfg = defaultJWTSettings key
      cookieCfg = defaultCookieSettings
      -- Pass both of the above on as a context
      -- :: Context '[CookieSettings, JWTSettings]
      ctx = cookieCfg :. jwtCfg :. EmptyContext


  say "Setting phasers to stun... (port 3000) (ctrl-c to quit)"
  Warp.runSettings warpSettings $ logStdoutDev $ app ctx cookieCfg jwtCfg config


-- | A convenience function which creates a Config instance. Although this is
-- simple at the moment this function will need to be re-factored as we move
-- towards a more complex application.
withConfig :: (Config -> IO a) -> IO a
withConfig run = do
  say "Getting application resources."

  say "Creating HTTP Manager."
  manager <-  newManager tlsManagerSettings

  -- Acquire a connection pool to an in memory (for now) database.
  say "Acquiring Sqlite database."
  pool <- runStdoutLoggingT $ do
    pool <- createSqlitePool ":memory" 1

    say "    Performing migrations..."
    -- Perform any necessary database migrations
    runSqlPool (runMigration migrateAll) pool
    return pool


  say "Making stdout logger."
  (logger, _) <- newFastLogger $ LogStdout defaultBufSize

  run $ Config pool manager logger
