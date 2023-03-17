import { Colors } from '../../styles'
import { TLineColor } from './types'

export const getLineColor = (colorKey: TLineColor) => {
    switch (colorKey) {
        case 'pink':
            return Colors.control.primary.bg
        case 'blue':
            return Colors.semantic.blue.base
        default:
            return Colors.background.hover
    }
}
