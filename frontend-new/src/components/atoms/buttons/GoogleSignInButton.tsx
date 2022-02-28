import React from 'react'
import { Platform, Pressable, Text } from 'react-native'
import { DEEPLINK_LOGIN_URL, LOGIN_URL } from '../../../constants'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { useAppDispatch } from '../../../redux/hooks'
import { setAuthToken } from '../../../redux/userDataSlice'


const GoogleSignInButton = () => {
    const dispatch = useAppDispatch()

    const onPressMobile = async () => {
        const result = await WebBrowser.openAuthSessionAsync(DEEPLINK_LOGIN_URL, '')
        if (result.type === 'success') {
            const { queryParams } = Linking.parse(result.url)
            dispatch(setAuthToken(queryParams.authToken))
        }
    }
    const onPressWeb = async () => {
        window.location.href = LOGIN_URL
    }
    const onPress = Platform.OS === 'web' ? onPressWeb : onPressMobile
    return (
        <Pressable onPress={onPress}>
            <Text>Sign in with Google!</Text>
        </Pressable>
    )
}

export default GoogleSignInButton
