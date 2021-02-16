{-# LANGUAGE TemplateHaskell #-}
-- | Global application settings, such as authorization tokens, or the
-- like. It is recommended to pull such settings from external files or
-- environment variables instead of entering them directly into this file.

module Settings where

import qualified Control.Exception     as Exception
--  ^ Only ever use this at compile time, as it is intended to crash
-- application. For runtime errors use Control.Monad.Except
import           Crypto.JOSE.JWK       (JWK)
import           Data.Aeson            (FromJSON (parseJSON), Value,
                                        decodeStrict, eitherDecode', withArray,
                                        withObject, (.:), (.:?))
import           Data.Aeson.Types      (Parser)
import           Data.FileEmbed        (embedStringFile)
import qualified Data.Vector           as V
import           Network.OAuth.OAuth2  (OAuth2 (OAuth2))
import           Relude
import           Relude.Unsafe         (fromJust)
import           Servant.Auth.Server   (generateKey)
import           Text.Shakespeare.Text (stext)
import           URI.ByteString        (URI)

newtype GoogleSettings = GoogleSettings OAuth2
  deriving (Show, Eq)

-- Read Google Settings from the configuration file JSON. This allows to just
-- drop and replace those settings as we update them, with added acess, etc...
--
-- It may well be that this format is generalizable, but there is no explicit
-- documentation on it, so until proven otherwise, assume the worst case
-- scenario that all OAuth2 json setups are distinct.

instance FromJSON GoogleSettings where
  parseJSON = withObject "oauth2" $ \o ->
    do oauth <- OAuth2 <$> o .: "client_id"
                       <*> o .:? "client_secret"
                       <*> o .: "auth_uri"
                       <*> o .: "token_uri"
                       <*> (getFirstEntry =<< (o .: "redirect_uris"))
       return $ GoogleSettings oauth
    where
      getFirstEntry :: Value -> Parser (Maybe URI)
      getFirstEntry = withArray "redirect_uri" $ \arr ->
        case V.headM arr of
          Just x  -> Just <$> parseJSON x
          Nothing -> return Nothing


-- | Compile time errors that can occur in reading settings
data ReadSettingsErr = CanNotParseGoogleCreds | CanNotParseGoogleJWK
  deriving (Show, Eq)

instance Exception.Exception ReadSettingsErr


-- | Parse the JSON contents of config/oath_clients/google.json at compile
-- time. We use these settings to facilitate interaction with the google auth
-- api.
--
-- TODO: generalize settings loading for other Oauth2 providers
googleSettings :: GoogleSettings
googleSettings = either (\ _ -> Exception.throw CanNotParseGoogleCreds) id $
  eitherDecode' $(embedStringFile "config/oath_clients/google.json")

-- | Google certificates for decoding their JWT tokens, available from:
--
--   https://www.googleapis.com/oauth2/v3/certs
--
-- TODO: Automate this to keep it up to date
googleJwk :: JWK
googleJwk = fromJust $
  decodeStrict jwk
  where
    jwk = encodeUtf8 [stext|
                            {
      "n": "lpk003IpXIRsNe9LyAWd9oy7mc9YxXsKNX9_I9mrwgeB2owQczjyw8iMeTfT-lDxztPY8tMMDp9a_F2ViQLL0_WX39gyNZ6DTh10y_vkEqooX_LT5SQvw1vkPXYNAPFOxqNDgebcB30hJC6YCDPyhN-i2BQQX5Vnu7-StaEopFXpQ12XWh-FV0ib1WU-9dC7m2zngaJb13YMpbI2rrj8YelJypUiq_K_YHcVet0bK1ue7NuVmCtX9WrVHGXXDuC-9X1wGTF6lQgC4r0AZiSsGYPcpR1hm4uHst13tF6wVAnEGjWdY9adrkgWRvIcoEORnPj-M_GwmKDBa4bJTHnGLw",
      "kty": "RSA",
      "use": "sig",
      "kid": "fdb40e2f9353c58add648b63634e5bbf63e4f502",
      "e": "AQAB",
      "alg": "RS256"
    }
    |]


-----------------
-- Authentication
-----------------

-- Key used to sign JWT tokens used internally by the application to validate
-- token requests. For simplicity we also use this for browser based
-- authentication, for encrypting cookies.
--
-- Currently we generate a new key for each session, obviously in a production
-- application we would persist this, likely in the database or other shared
-- configuration store, so that multiple instances of the applications would be
-- able to validate tokens from a single client.
jwtPrivateKey :: IO JWK
jwtPrivateKey = generateKey
