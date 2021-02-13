{-# LANGUAGE StandaloneDeriving   #-}
{-# LANGUAGE TemplateHaskell      #-}
{-# LANGUAGE UndecidableInstances #-}

-- | The primary database model for the application. In the future it would make
-- sense to abstract this into a separate package / git revision tree, to gain
-- more control of migrations.
--
-- For now, it is a direct 1-1 map between Haskell record types and a SQL-like
-- database. For more information on how such a schema works, checkout
--
--   https://www.yesodweb.com/book/persistent
--
-- However, it should be reasonably obvious how to edit this file to produce the
-- desired database schema, or adapt to an existing schema.


module Database.Model where

import           Database.Persist
import           Database.Persist.Sqlite
import           Database.Persist.TH
import           Database.Types
import           Handlers.Type
import           Relude



share [mkPersist sqlSettings, mkMigrate "migrateAll"] [persistLowerCase|
User json
  googleToken OAuth2Token
  identifier Text
  email Text
  fullName Text
  UniqueIdentifier identifier
  deriving Show Eq
|]


-- | Run a query against the database using the connection pool defined in
-- @Config@. The type signature is intentionally generic for future proofing,
-- but for almost all use cases substituting @App@ for @m@ is sufficient.
runDb :: (MonadReader Config m, MonadIO m) => SqlPersistT IO b -> m b
runDb query = do
    pool <- asks dbPool
    liftIO $ runSqlPool query pool
