{-# LANGUAGE TemplateHaskell #-}
-- | A sample "app" which is just a raw HTML content representation of our
-- application.

module Handlers.App where

import           Database.Model
import qualified Database.Persist   as P
import           Handlers.Tasks
import           Handlers.Type
import           Relude
import           Servant
import           Servant.HTML.Blaze
import qualified Text.Blaze.Html    as H
import           Text.Hamlet

showt :: (Show a) => a -> Text
showt = show

type AppAPI = "app" :> Get '[HTML] H.Html

getApp :: (MonadIO m) => UserId -> AppT m H.Html
getApp userId = do
  user <-  runDb (P.get userId) >>= \case
    Just u -> return u
    Nothing -> throwError err500
  tasks <- map P.entityVal <$> getTaskList userId
  return $(shamletFile "templates/app.hamlet")
