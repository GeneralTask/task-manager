import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import { TIconSize } from '../../../styles/dimensions'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { forwardRef } from 'react'
import styled from 'styled-components'

const Button = styled(NoStyleButton)`
    padding: ${Spacing._8};
    border-radius: 50%;
    :hover {
        background: ${Colors.background.dark};
    }
`

interface GTIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: IconProp | string
    size: TIconSize
    iconColor?: TIconColor
}
const GTIconButton = forwardRef(
    ({ icon, size, iconColor, onClick, ...props }: GTIconButtonProps, ref: React.Ref<HTMLButtonElement>) => {
        return (
            <Button ref={ref} onClick={onClick} {...props}>
                <Icon icon={icon} color={iconColor} size={size} />
            </Button>
        )
    }
)

export default GTIconButton
