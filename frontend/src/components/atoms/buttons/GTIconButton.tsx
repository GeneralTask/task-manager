import { IconProp } from '@fortawesome/fontawesome-svg-core'
import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
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
    iconColor?: TIconColor
}
const GTIconButton = ({ icon, iconColor, onClick, ...props }: GTIconButtonProps) => {
    return (
        <Button onClick={onClick} {...props}>
            <Icon icon={icon} color={iconColor} size="small" />
        </Button>
    )
}

export default GTIconButton
