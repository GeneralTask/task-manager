import { Colors } from '../../../styles'
import { TLineColor } from './types'

export const getLineColor = (colorKey: TLineColor) => {
    switch (colorKey) {
        case 'pink':
            return Colors.control.primary.bg
        case 'gray':
            return Colors.background.hover
        case 'blue':
            return Colors.semantic.blue.base
    }
}
