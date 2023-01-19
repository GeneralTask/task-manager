import Cookie from 'js-cookie'
import { AUTHORIZATION_COOKE, COOKIE_DOMAIN } from '../constants'
import getEnvVars from '../environment'

export const isAuthenticated = () => Cookie.get(AUTHORIZATION_COOKE) !== undefined

export const authSignOut = () => {
    Cookie.remove(AUTHORIZATION_COOKE, { path: '/', domain: COOKIE_DOMAIN })
    Cookie.remove(AUTHORIZATION_COOKE) // used for cypress tests
    window.location.href = getEnvVars().REACT_APP_TRY_BASE_URL
}
