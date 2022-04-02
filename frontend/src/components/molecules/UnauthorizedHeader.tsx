import React from 'react'
import { Colors } from '../../styles'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { useNavigate } from 'react-router-dom'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

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
    padding: ${Spacing.padding.small}px ${Spacing.padding.medium}px;
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
