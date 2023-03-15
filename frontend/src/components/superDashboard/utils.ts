import { Colors } from '../../styles'
import { LineColor } from './types'

export const getLineColor = (colorKey: LineColor) => {
    switch (colorKey) {
        case 'pink':
            return Colors.control.primary.bg
        case 'gray':
            return Colors.background.hover
        case 'blue':
            return Colors.semantic.blue.base
    }
}
