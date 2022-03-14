import React from 'react'
import styled from 'styled-components/native'
import { Border, Colors, Spacing, Typography } from '../../../styles'

const PressableStyled = styled.Pressable<{ hasBorder: boolean }>`
    border-radius: ${Border.radius.large};
    ${(props) =>
        props.hasBorder &&
        `
        border: 1px solid ${Colors.gray._200};
        box-shadow: rgba(0, 0, 0, 0.07) 0px 1px 2px;
    `}
`
const RoundedView = styled.View<{ color: string }>`
    background-color: ${(props) => props.color};
    padding: ${Spacing.padding.small}px;
    text-align: center;
    border-radius: ${Border.radius.large};
    height: 100%;
    width: 100%;
`
const ModalText = styled.Text<{ textStyle: 'light' | 'dark' }>`
    color: ${(props) => (props.textStyle === 'light' ? Colors.white : Colors.black)};
    font-weight: ${Typography.weight._600.fontWeight};
    font-side: ${Typography.xSmall.fontSize}px;
`

interface ModalButtonProps {
    value: string
    onPress: () => void
    color?: string
    textStyle?: 'light' | 'dark'
    hasBorder?: boolean
}
const RoundedGeneralButton = (props: ModalButtonProps) => {
    return (
        <PressableStyled onPress={props.onPress} hasBorder={!!props.hasBorder}>
            <RoundedView color={props.color || Colors.white}>
                <ModalText textStyle={props.textStyle || 'light'}>{props.value}</ModalText>
            </RoundedView>
        </PressableStyled>
    )
}

export default RoundedGeneralButton
