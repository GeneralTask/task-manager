import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'

const HeaderContainer = styled.div`
    display: flex;
    align-items: center;
    padding: ${Spacing._16} ${Spacing._8} ${Spacing._4};
`
const Title = styled.span`
    color: ${Colors.text.black};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    text-transform: uppercase;
    ${Typography.body.small};
`

interface NavigationHeaderProps {
    title: string
    rightContent: React.ReactNode
}
const NavigationHeader = ({ title, rightContent }: NavigationHeaderProps) => (
    <HeaderContainer>
        <Title>{title}</Title>
        {rightContent}
    </HeaderContainer>
)

export default NavigationHeader
