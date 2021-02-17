-- | External login functionality. We use this only to construct a redirect
-- request for log in, but in the future we may wish to expand this to support
-- incremental authorization.

module ExternalApi.Google.OAuth where

import qualified Data.Text           as T
import           Handlers.Type
import           Relude
import           Servant
import           Servant.Auth
import           Servant.Auth.Client
import           Servant.Client

data AuthScope
  = GmailReadonly
  | UserInfoProfile


authScopeURI :: AuthScope -> Text
authScopeURI GmailReadonly = "https://www.googleapis.com/auth/gmail.readonly"
authScopeURI UserInfoProfile = "https://www.googleapis.com/auth/userinfo.profile"

instance ToHttpApiData [AuthScope] where
  toQueryParam = T.intercalate " "  . map authScopeURI

data AccessType = Offline

instance ToHttpApiData AccessType where
  toQueryParam Offline = "offline"

data ResponseType = Code

instance ToHttpApiData ResponseType where
  toQueryParam Code = "code"


type OAuthAPI =
  "o" :> "oauth2" :> "v2" :> "auth"
  :> QueryParam "scope" [AuthScope]
  :> QueryParam "access_type" AccessType
  :> QueryParam "include_granted_scopes" Bool
  :> QueryParam "response_type" ResponseType
  :> QueryParam "redirect_uri" Text
  :> QueryParam "client_id" Text
  :> GetNoContent
