import { Colors } from '../../styles'
import { Icon, Divider } from '@atoms'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import React from 'react'
import { Spacing } from '../../styles'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

const Header = styled.div`
    width: 100%;
    position: sticky;
    top: 0;
    background-color: ${Colors.white};
    z-index: 1;
`
const IconContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._8}px ${Spacing.padding._16}px;
`
const UnauthorizedHeader = () => {
    const navigate = useNavigate()
    return (
        <Header>
            <IconContainer>
                <NoStyleButton onClick={() => navigate('/')}>
                    <Icon size="medium" />
                </NoStyleButton>
            </IconContainer>
            <Divider />
        </Header>
    )
}

export default UnauthorizedHeader
