import { IconProp } from '@fortawesome/fontawesome-svg-core'
import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import { TIconSize } from '../../../styles/dimensions'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

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
const GTIconButton = ({ icon, size, iconColor, onClick, ...props }: GTIconButtonProps) => {
    return (
        <Button onClick={onClick} {...props}>
            <Icon icon={icon} color={iconColor} size={size} />
        </Button>
    )
}

export default GTIconButton
