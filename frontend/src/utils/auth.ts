import Cookie from 'js-cookie'
import { AUTHORIZATION_COOKE, COOKIE_DOMAIN } from '../constants'
import getEnvVars from '../environment'
import Log from '../services/api/log'

const AUTH_WINDOW_WIDTH = 960
const AUTH_WINDOW_HEIGHT = 640

export const isAuthenticated = () => Cookie.get(AUTHORIZATION_COOKE) !== undefined

export const authSignOut = () => {
    Cookie.remove(AUTHORIZATION_COOKE, { path: '/', domain: COOKIE_DOMAIN })
    Cookie.remove(AUTHORIZATION_COOKE) // used for cypress tests
    window.location.href = getEnvVars().REACT_APP_TRY_BASE_URL
}

export const openPopupWindow = (authorizationURL: string, onWindowClose: () => void) => {
    Log(`open_auth_window_${authorizationURL}`)
    const left = (screen.width - AUTH_WINDOW_WIDTH) / 2
    const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4
    const win = window.open(
        authorizationURL,
        '_blank',
        `height=${AUTH_WINDOW_HEIGHT},width=${AUTH_WINDOW_WIDTH},top=${top},left=${left}toolbar=no,menubar=no,scrollbars=no,location=no,status=no`
    )
    if (win != null) {
        const timer = setInterval(() => {
            if (win.closed) {
                clearInterval(timer)
                onWindowClose()
            }
        })
    }
}
