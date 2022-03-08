import { ImageSourcePropType, Platform } from 'react-native'

export const size = {
    logo: {
        header: Platform.OS === 'web' ? '50px' : 50
    }
}

export const logos = {
    generaltask: require('../assets/generaltask.png'),
    asana: require('../assets/asana.png'),
    github: require('../assets/github.png'),
    gmail: require('../assets/gmail.png'),
    gcal: require('../assets/gcal.png'),
} as { [key: string]: ImageSourcePropType }
