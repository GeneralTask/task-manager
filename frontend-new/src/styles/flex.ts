import { ViewStyle } from 'react-native'

export const column: ViewStyle = {
    display: 'flex',
    flexDirection: 'column',
}

export const columnCenter: ViewStyle = {
    ...column,
    alignItems: 'center',
}

export const row: ViewStyle = {
    display: 'flex',
    flexDirection: 'row',
}

export const wrap: ViewStyle = {
    display: 'flex',
    flexWrap: 'wrap',
}
