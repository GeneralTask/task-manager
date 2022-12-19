import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'

const DropdownContainer = styled.div`
    display: flex;
    align-items: center;
    padding: ${Spacing._16} 0 ${Spacing._4};
    margin: 0 ${Spacing._4} 0 ${Spacing._12};
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
    rightContent: React.ReactNode
}
const NavigationHeader = ({ title, rightContent }: NavigationHeaderProps) => (
    <DropdownContainer>
        <Title>{title}</Title>
        {rightContent}
    </DropdownContainer>
)

export default NavigationHeader
