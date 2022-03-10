import { ImageSourcePropType, Platform } from 'react-native'

export const size = {
    logo: {
        header: Platform.OS === 'web' ? '50px' : 50
    }
}

export const icons: { [key: string]: ImageSourcePropType } = {
    gear: require('../assets/gear.png'),
    spinner: require('../assets/spinner.png'),
    trash: require('../assets/trash.png')
}

export const logos: { [key: string]: ImageSourcePropType } = {
    generaltask: require('../assets/generaltask.png'),
    asana: require('../assets/asana.png'),
    github: require('../assets/github.png'),
    gmail: require('../assets/gmail.png'),
    gcal: require('../assets/gcal.png'),
}
