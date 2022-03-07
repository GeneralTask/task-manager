import { Platform, TextStyle } from 'react-native'

export const fontSize = {
    header: Platform.OS === 'web' ? 58 : 33,
    subheader: Platform.OS === 'web' ? 27 : 16,
}

export const xxSmall: TextStyle = {
    fontSize: 13,
    lineHeight: 16,
}

export const xSmall: TextStyle = {
    fontSize: 14,
    lineHeight: 20,
}

export const small: TextStyle = {
    fontSize: 16,
    lineHeight: 24,
}

export const medium: TextStyle = {
    fontSize: 18,
    lineHeight: 24,
}

export const large: TextStyle = {
    fontSize: 20,
    lineHeight: 32,
}

export const xLarge: TextStyle = {
    fontSize: 24,
    lineHeight: 32,
}

export const xxLarge: TextStyle = {
    fontSize: 32,
    lineHeight: 40,
}

export const weight = {
    _400: {
        fontWeight: '400',
    } as TextStyle,
    _500: {
        fontWeight: '500',
    } as TextStyle,
    _600: {
        fontWeight: '600',
    } as TextStyle,
}
