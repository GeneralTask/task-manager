import React from 'react'
import { Pressable } from 'react-native'
import { Colors } from '../../styles'
import styled from 'styled-components/native'
import { useNavigate } from '../../services/routing'
import { Spacing } from '../../styles'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'

const Header = styled.View`
    width: 100%;
    position: sticky;
    top: 0;
    background-color: ${Colors.white};
    z-index: 1;
`
const IconContainer = styled.View`
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
                <Pressable onPress={() => navigate('/')}>
                    <Icon size="medium" />
                </Pressable>
            </IconContainer>
            <Divider />
        </Header>
    )
}

export default UnauthorizedHeader
