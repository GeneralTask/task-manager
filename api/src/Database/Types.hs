{-# OPTIONS_GHC -fno-warn-orphans #-}
-- | Instances of locally defined types, such as Enum's or token wrappers, as
-- SQL persist-able rows in the database
--
-- The above instances

module Database.Types
  ( OAuth2Token )
where

import           Database.Persist        (PersistField (..),
                                          SqlType (SqlString),
                                          fromPersistValueJSON,
                                          toPersistValueJSON)
import           Database.Persist.Sqlite (PersistFieldSql (..))
import           Network.OAuth.OAuth2    (OAuth2Token)


-- Simply store OAuth2Token information as JSON. Given the small size, and
-- infrequent updates, this is actually decently performant.
--
-- For more information see:
--   https://hackage.haskell.org/package/persistent-2.11.0.2/docs/Database-Persist-Class.html#g:9
instance PersistField OAuth2Token where
  fromPersistValue = fromPersistValueJSON
  toPersistValue = toPersistValueJSON

instance PersistFieldSql OAuth2Token where
  -- Currently just store the JSON blob as a string. Were we to switch to a
  -- different persistent backend we could use something better, like Postgres'
  -- built in JSON type.
  sqlType _ = SqlString
