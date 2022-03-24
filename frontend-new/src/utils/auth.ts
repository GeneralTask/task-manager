import { Dispatch } from '@reduxjs/toolkit'
import Cookie from 'js-cookie'
import { Platform } from 'react-native'
import { setAuthToken } from '../redux/userDataSlice'

export const isAuthenticated = () => {
    if (Platform.OS === 'web') {
        return Cookie.get('authToken') !== undefined
    }
    return false
}

export const authSignOut = (dispatch: Dispatch) => {
    dispatch(setAuthToken(undefined))

    if (Platform.OS === 'web') {
        Cookie.remove('authToken', { path: '/', domain: '.generaltask.com' })
        window.location.href = '/'
    }
}

