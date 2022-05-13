import Cookie from 'js-cookie'
import { AUTHORIZATION_COOKE, COOKIE_DOMAIN } from '../constants'
import { TSupportedType } from './types';

const AUTH_WINDOW_WIDTH = 960
const AUTH_WINDOW_HEIGHT = 640

export const isAuthenticated = () => Cookie.get(AUTHORIZATION_COOKE) !== undefined

export const authSignOut = () => {
    Cookie.remove(AUTHORIZATION_COOKE, { path: '/', domain: COOKIE_DOMAIN })
    window.location.href = '/'
}

export const openAuthWindow = (authorizationType: string, supportedTypes: TSupportedType[], refetch: () => void) => {
    for (const type of supportedTypes) {
        if (type.name === authorizationType) {
            const left = (screen.width - AUTH_WINDOW_WIDTH) / 2
            const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4
            const win = window.open(
                type.authorization_url,
                type.name,
                `height=${AUTH_WINDOW_HEIGHT},width=${AUTH_WINDOW_WIDTH},top=${top},left=${left}toolbar=no,menubar=no,scrollbars=no,location=no,status=no`
            )
            if (win != null) {
                const timer = setInterval(() => {
                    if (win.closed) {
                        clearInterval(timer)
                        refetch()
                    }
                }, 10)
            }
        }
    }
}
