import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Colors } from '../../styles'
import { Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

const Header = styled.div`
    width: 100%;
    position: sticky;
    top: 0;
    background-color: ${Colors.background.white};
    z-index: 1;
`
const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing._8} ${Spacing._16};
`
const UnauthorizedHeader = () => {
    const navigate = useNavigate()
    return (
        <Header>
            <IconContainer>
                <NoStyleButton onClick={() => navigate('/')}>
                    <Icon icon={logos.generaltask} color="purple" size="medium" />
                </NoStyleButton>
            </IconContainer>
            <Divider />
        </Header>
    )
}

export default UnauthorizedHeader
