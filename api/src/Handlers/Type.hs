-- | Define a specific type of monad transformer that is naturally equivilant to
-- the @Handler@ monad.

module Handlers.Type where

import           Control.Monad.Except    (ExceptT, Functor, Monad, MonadError,
                                          MonadIO)
import           Data.Pool               (Pool)
import           Database.Persist.Sqlite (SqlBackend)
import           Network.HTTP.Client     (Manager)
import           Relude
import           Servant                 (Handler (Handler), ServerError)


-- | A monad stack built mimicking the @Handler@ monad. This allows us several
-- things, among them is a In this monad stack we have the following:
--
--   a. Error handling of @ServerError@
--   b. Access to @Config@ via a @MonadReader@ instance.
--
-- (Haskell asides
-- We wrap a ReaderT in a newtype, in order to avoid orphan instances of the
-- generic ReaderT type, and allow for deriving of stock classes via Newtype
-- Deriving.
newtype AppT m a =
  AppT { runApp :: ReaderT Config (ExceptT ServerError m) a }
  deriving ( Functor, Applicative, Monad, MonadReader Config, MonadError ServerError, MonadIO)

-- | Usually it suffices to run AppT over the IO monad, we provide this alias
-- for simplicity
type App = AppT IO

-- | Application configuration, this is accessible from any point in the
-- application via the instance of @MonadReader Config App@. This shared
-- information contains:
--
--  a. A database connection (see Database.Schema)
--  b. An HTTP connection manager
--
--
-- b) Allows us to query external api's (such as google, github, etc.. - the
-- core of the application) in a performant manner.
data Config = Config
  { dbPool      :: Pool SqlBackend
  , httpManager :: Manager }

-- | The textbook (see Mac Lane's Algebra CH. V) definition of a natural
-- transformation between categories.
--
-- Non mathematically speaking, this is just a morphism of containers. For
-- instance we say "Either String a" and "Maybe a" are isomorphic by the
-- transformation
--
-- > nat :: Either String ~> Maybe
-- > nat (Either _ b) = Just b
type (~>) m n = forall a. m a -> n a

-- | Natural transformation of our application to a generic servant
-- handler. Recall that @Handler@ is simply a wrapper around @ExceptT
-- ServerError IO a@.
appToHandler :: Config -> App ~> Handler
appToHandler conf app = Handler $ runReaderT (runApp app) conf
