import { forwardRef } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'
import { TIconColor } from '../../../styles/colors'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

const Button = styled(NoStyleButton)<{ forceShowHover?: boolean }>`
    padding: ${Spacing._8};
    border-radius: 50%;
    :hover {
        background: ${Colors.background.dark};
    }
    ${({ forceShowHover }) => (forceShowHover ? `background: ${Colors.background.dark};` : '')}
`

interface GTIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: IconProp | string
    iconColor?: TIconColor
    forceShowHover?: boolean
}
const GTIconButton = forwardRef(
    ({ icon, iconColor, forceShowHover, onClick, ...props }: GTIconButtonProps, ref: React.Ref<HTMLButtonElement>) => {
        return (
            <Button ref={ref} onClick={onClick} forceShowHover={forceShowHover} {...props}>
                <Icon icon={icon} color={iconColor} />
            </Button>
        )
    }
)

export default GTIconButton
