import { forwardRef } from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import { Icon, TIconType } from '../Icon'
import NoStyleButton from './NoStyleButton'

const Button = styled(NoStyleButton)<{ forceShowHoverEffect?: boolean }>`
    padding: ${Spacing._8};
    border-radius: 50%;
    :hover {
        background: ${Colors.background.dark};
    }
    ${({ forceShowHoverEffect }) => (forceShowHoverEffect ? `background: ${Colors.background.dark};` : '')}
`

interface GTIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: TIconType
    iconColor?: TIconColor
    forceShowHoverEffect?: boolean
}
const GTIconButton = forwardRef(
    (
        { icon, iconColor, forceShowHoverEffect, onClick, ...props }: GTIconButtonProps,
        ref: React.Ref<HTMLButtonElement>
    ) => {
        return (
            <Button ref={ref} onClick={onClick} forceShowHoverEffect={forceShowHoverEffect} {...props}>
                <Icon icon={icon} color={iconColor} />
            </Button>
        )
    }
)

export default GTIconButton
