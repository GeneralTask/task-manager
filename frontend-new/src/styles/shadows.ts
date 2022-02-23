import { Platform } from "react-native"

const SHADOW_COLOR = '#000'

export const xSmall = Platform.OS === 'web' ?
    {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.07)'
    } :
    {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 2,
    }

export const small = Platform.OS === 'web' ?
    {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)'
    } :
    {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    }

export const medium = Platform.OS === 'web' ?
    {
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.06), 0px 4px 6px -1px rgba(0, 0, 0, 0.1)'
    } :
    {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
    }
export const large = Platform.OS === 'web' ?
    {
        boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.06), 0px 10px 15px -3px rgba(0, 0, 0, 0.1)'
    } :
    {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    }

export const xLarge = Platform.OS === 'web' ?
    {
        boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.06), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)'
    } :
    {
        SHADOW_COLOR: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    }
