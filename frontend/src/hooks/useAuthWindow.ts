import { useState } from 'react'
import { useQueryClient } from 'react-query'
import Cookie from 'js-cookie'
import { AUTHORIZATION_COOKE, COOKIE_DOMAIN, GOOGLE_AUTH_ROUTE } from '../constants'
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

export interface OpenAuthWindowOptions {
    url?: string
    onWindowClose?: () => void
    logEvent?: boolean
    closeOnCookieSet?: boolean
    isGoogleSignIn?: boolean
}

const useAuthWindow = () => {
    const [isAuthWindowOpen, setIsAuthWindowOpen] = useState(false)
    const queryClient = useQueryClient()

    const openAuthWindow = ({
        url,
        onWindowClose,
        logEvent = true,
        closeOnCookieSet = false,
        isGoogleSignIn = false,
    }: OpenAuthWindowOptions) => {
        if (!url) return
        if (logEvent) Log(`open_auth_window_${url}`)
        const left = (screen.width - AUTH_WINDOW_WIDTH) / 2
        const top = (screen.height - AUTH_WINDOW_HEIGHT) / 4
        const link = isGoogleSignIn
            ? `${getEnvVars().REACT_APP_FRONTEND_BASE_URL}/${GOOGLE_AUTH_ROUTE}?authUrl=${url}`
            : url
        const win = window.open(
            link,
            '_blank',
            `height=${AUTH_WINDOW_HEIGHT},width=${AUTH_WINDOW_WIDTH},top=${top},left=${left}toolbar=no,menubar=no,scrollbars=no,location=no,status=no`
        )
        const onClose = (timer: NodeJS.Timer) => {
            clearInterval(timer)
            queryClient.refetchQueries() // refetch everything
            setIsAuthWindowOpen(false)
            onWindowClose?.()
        }

        if (win != null) {
            setIsAuthWindowOpen(true)
            const timer = setInterval(() => {
                if (closeOnCookieSet && Cookie.get(AUTHORIZATION_COOKE)) {
                    win.close()
                    onClose(timer)
                }
                if (win.closed) {
                    onClose(timer)
                }
            })
        }
    }

    return {
        isAuthWindowOpen,
        openAuthWindow,
    }
}

export default useAuthWindow
