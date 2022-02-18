import Cookie from 'js-cookie'
import { Platform } from 'react-native'

export const isAuthenticated = () => {
    if (Platform.OS === 'web') {
        return Cookie.get('authToken') !== undefined
    }
    return false
}

export const authSignOut = () => {
    if (Platform.OS === 'web') {
        Cookie.remove('authToken')
        window.location.href = '/'
    }
}

