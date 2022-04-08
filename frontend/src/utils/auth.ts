import { Dispatch } from '@reduxjs/toolkit'
import Cookie from 'js-cookie'
import { AUTHORIZATION_COOKE } from '../constants'
import { setAuthToken } from '../redux/userDataSlice'

export const isAuthenticated = () => Cookie.get(AUTHORIZATION_COOKE) !== undefined

export const authSignOut = (dispatch: Dispatch) => {
    dispatch(setAuthToken(undefined))
    Cookie.remove(AUTHORIZATION_COOKE, { path: '/', domain: '.generaltask.com' }) //production cookie
    Cookie.remove(AUTHORIZATION_COOKE) //testing cookie
    window.location.href = '/'
}

