{-# LANGUAGE TemplateHaskell #-}
-- | Global application settings, such as authorization tokens, or the
-- like. It is recommended to pull such settings from external files or
-- environment variables instead of entering them directly into this file.

module Settings where

import qualified Control.Exception    as Exception
--  ^ Only ever use this at compile time, as it is intended to crash
-- application. For runtime errors use Control.Monad.Except
import           Data.Aeson           (FromJSON (parseJSON), Value,
                                       eitherDecode', withArray, withObject,
                                       (.:), (.:?))
import           Data.Aeson.Types     (Parser)
import           Data.FileEmbed       (embedStringFile)
import qualified Data.Vector          as V
import           Network.OAuth.OAuth2 (OAuth2 (OAuth2))
import           Relude
import           URI.ByteString       (URI)

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
data ReadSettingsErr = CanNotParseGoogleCreds
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
