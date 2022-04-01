import React from 'react'
import { Pressable } from 'react-native'
import { Colors } from '../../styles'
import styled from 'styled-components/native'
import { Spacing, Typography } from '../../styles'
import { Icon } from '../atoms/Icon'
import { useNavigate } from 'react-router-dom'

const Footer = styled.View`
    position: sticky;
    bottom: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding.small}px ${Spacing.padding.medium}px;
    background-color: ${Colors.purple._2};
    width: 100%;
    z-index: 1;
`
const FooterView = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.margin.medium}px;
`
const FooterText = styled.Text`
    color: ${Colors.white};
    font-weight: ${Typography.weight._600.fontWeight};
    font-size: ${Typography.xxSmall.fontSize}px;
`
const UnauthorizedFooter = () => {
    const navigate = useNavigate()
    return (
        <Footer>
            <FooterView>
                <Icon size="medium" />
                <FooterText>General Task, Inc. © 2022</FooterText>
            </FooterView>
            <FooterView>
                <Pressable onPress={() => navigate('/privacy-policy')}>
                    <FooterText>Privacy Policy</FooterText>
                </Pressable>
                <Pressable onPress={() => navigate('/terms-of-service')}>
                    <FooterText>Terms of Service</FooterText>
                </Pressable>
            </FooterView>
        </Footer>
    )
}

export default UnauthorizedFooter
