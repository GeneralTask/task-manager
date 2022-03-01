import React from 'react'
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native'
import { DEEPLINK_LOGIN_URL, LOGIN_URL } from '../../../constants'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { useAppDispatch } from '../../../redux/hooks'
import { setAuthToken } from '../../../redux/userDataSlice'

const googleButtonDimensions = {
    width: 191,
    height: 92,
}

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
        <View style={styles.buttonContainer}>
            <Pressable onPress={onPress}>
                <Image style={styles.googleSignIn} source={require('../../../assets/google_sign_in.png')} />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        flex: 1,
        alignItems: 'center',
        maxHeight: googleButtonDimensions.height,
    },
    googleSignIn: {
        flex: 1,
        width: googleButtonDimensions.width,
        height: googleButtonDimensions.height,
        resizeMode: 'contain',
    },
})

export default GoogleSignInButton
