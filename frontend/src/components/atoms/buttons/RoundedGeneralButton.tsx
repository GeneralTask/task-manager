import { Border, Colors, Spacing, Typography } from '../../../styles'

import React from 'react'
import styled from 'styled-components/native'

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
    padding: ${Spacing.padding._8}px;
    text-align: center;
    border-radius: ${Border.radius.large};
    height: 100%;
    width: 100%;
`
const ModalText = styled.Text<{ textStyle: 'light' | 'dark', wrapText?: boolean }>`
    color: ${(props) => (props.textStyle === 'light' ? Colors.white : Colors.black)};
    font-weight: ${Typography.weight._600.fontWeight};
    font-size: ${Typography.xSmall.fontSize}px;
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
`

interface RoundedGeneralButtonProps {
    value: string
    onPress: () => void
    color?: string
    textStyle?: 'light' | 'dark'
    wrapText?: boolean
    hasBorder?: boolean
    disabled?: boolean
}
const RoundedGeneralButton = (props: RoundedGeneralButtonProps) => {
    const color = props.disabled ? Colors.gray._400 : props.color || Colors.white
    return (
        <PressableStyled disabled={!!props.disabled} onPress={props.onPress} hasBorder={!!props.hasBorder}>
            <RoundedView color={color}>
                <ModalText textStyle={props.textStyle || 'light'} wrapText={props.wrapText}>{props.value}</ModalText>
            </RoundedView>
        </PressableStyled >
    )
}

export default RoundedGeneralButton
