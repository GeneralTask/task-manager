import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { LOGIN_URL } from "../../constants";
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'


const GoogleSignInButton = () => {
    const onPressMobile = async () => {
        let result = await WebBrowser.openAuthSessionAsync('https://nolanjimenez.com', '');
        if (result.type === 'success') {
            let { queryParams } = Linking.parse(result.url);
            console.log(queryParams);
        }
    }
    const onPressWeb = async () => {
        window.location.href = LOGIN_URL
    }
    const onPress = Platform.OS === 'web' ? onPressWeb : onPressMobile;
    return (
        <Pressable onPress={onPress}>
            <Text>Sign in with Google!</Text>
        </Pressable>
    )
}

export default GoogleSignInButton
