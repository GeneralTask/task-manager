import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import Tip from '../radix/Tip'

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
    rightContent: React.ReactNode
}
const NavigationHeader = ({ title, tooltip, rightContent }: NavigationHeaderProps) => (
    <DropdownContainer>
        <Title>{title}</Title>
        <Tip content={tooltip}>{rightContent}</Tip>
    </DropdownContainer>
)

export default NavigationHeader
