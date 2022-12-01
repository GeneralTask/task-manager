import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import TooltipWrapper from '../atoms/TooltipWrapper'

const DropdownContainer = styled.div`
    display: flex;
    align-items: center;
    padding: ${Spacing._16} 0 ${Spacing._4};
`
const Title = styled.span`
    color: ${Colors.text.black};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.eyebrow};
`

interface NavigationHeaderProps {
    title: string
    tooltip: string
    button: React.ReactNode
}
const NavigationHeader = ({ title, tooltip, button }: NavigationHeaderProps) => (
    <DropdownContainer>
        <Title>{title}</Title>
        <TooltipWrapper dataTip={tooltip} tooltipId="tooltip">
            {button}
            {/* <GTIconButton icon={icon ?? icons.x} onClick={handleOnClick} /> */}
        </TooltipWrapper>
    </DropdownContainer>
)

export default NavigationHeader
