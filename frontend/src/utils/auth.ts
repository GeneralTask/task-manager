import { Dispatch } from '@reduxjs/toolkit'
import Cookie from 'js-cookie'
import { setAuthToken } from '../redux/userDataSlice'

export const isAuthenticated = () => Cookie.get('authToken') !== undefined

export const authSignOut = (dispatch: Dispatch) => {
    dispatch(setAuthToken(undefined))
    Cookie.remove('authToken', { path: '/', domain: '.generaltask.com' }) //production cookie
    Cookie.remove('authToken') //testing cookie
    window.location.href = '/'
}

