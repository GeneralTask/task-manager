-- | Handles the actual presentation of tasks, and provides a simple mechanism
-- for loading them into the database.

module Handlers.Tasks where

import           Database.Model
import           Database.Persist
import qualified ExternalApi.Google.Mail as Gmail
import           Handlers.Type
import           Network.OAuth.OAuth2
import           Relude
import           Servant
import           Servant.Auth.Client
import           Servant.HTML.Blaze


type TasksAPI =
  "task" :> "list" :> Get '[JSON] [Entity Task] :<|>
  -- ^ List all tasks associated with the currently authenticated user
  "task" :> "refresh-html" :> Get '[JSON] [Entity Task]
  -- ^ Refresh the tasks and redirect. This is a temporary gimmick and will be
  -- removed in any type of future application.


-- | Returns a list of all tasks for the relevant user.
getTaskList :: (MonadIO m) => UserId -> AppT m [Entity Task]
getTaskList userId = runDb $ selectList [TaskAssociatedUser  ==. userId] [LimitTo 100]


-- | Call the relevant API's to refresh all tasks for the given user.
--
-- Currently, this does no Caching, only accesses GMail, and gets all messages
-- up to pagination, but no more -- Obviously, there is room for
--improvement. However, it serves as a template / example.
listNewTasks :: (MonadIO m) => Entity User -> AppT m [Task]
listNewTasks (Entity uid u) = do
  -- Grab the tasks from GMail, using the users token
  let (AccessToken jwt) = accessToken $ userGoogleToken u

  -- Get the messages and extract the tasks from them
  mbMails <- Gmail.runGmailApi $
    Gmail.getGmailMessages (Token $ encodeUtf8 jwt) Gmail.GmailUserMe

  -- Extract
  Gmail.GmailMessageList mails <- case mbMails of
    Right mail -> return mail
    Left err ->
      -- This is entirely the wrong error code / handling, and should be
      -- improved.
      log ("Client error " <> show err) >> throwError err500

  -- Turn the messages into tasks
  return $ flip map mails $ \message ->
    Task { taskAssociatedId = Gmail.gmail_message_id message
         , taskAssociatedUser = uid
         , taskName = Gmail.gmail_message_snippet message
         , taskBody = decodeUtf8 $ Gmail.gmail_message_payloadBody message
         , taskDateAssigned = Gmail.gmail_message_internalDate message
         }


-- | This is another temporary placeholder. It grabs all relevant tasks and then
-- stores them in the database. This done, it redirects to home. Obviously this
-- type of thing would never exist in an actual API and the function would be
-- distributed across a few pieces.
getRefreshHtml :: (MonadIO m) => UserId -> AppT m [Entity Task]
getRefreshHtml user = do
  -- Grab the full user from the database.
  user <- runDb (getEntity user) >>= \case
    Just u -> return u
    Nothing -> log "User not found in database" >> throwError err500

  -- Take all takss, and insert them into the database (replacing existing) - I
  -- won't enumerate the problems with this, since they are obvious and many,
  -- but they will need to be addressed before production.
  tasks <- listNewTasks user
  runDb $ insertMany_ tasks

  -- Redirect to home, this is a bit janky.
  throwError $ err301 { errHeaders = [("Location", "/")] }
