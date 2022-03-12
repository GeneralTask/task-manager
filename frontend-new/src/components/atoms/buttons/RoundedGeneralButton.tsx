import React from 'react'
import styled from 'styled-components/native'
import { Border, Colors, Spacing, Typography } from '../../../styles'

const PressableStyled = styled.Pressable<{ isColored: boolean }>`
    border-radius: ${Border.radius.large};
    ${props => props.isColored ? '' : `
        border: 1px solid ${Colors.gray._200};
        box-shadow: rgba(0, 0, 0, 0.07) 0px 1px 2px;
    `}
`
const RoundedView = styled.View<{ isColored: boolean }>`
    background-color: ${props => props.isColored ? Colors.purple : Colors.white};
    padding: ${Spacing.padding.small}px;
    text-align: center;
    border-radius: ${Border.radius.large};
    height: 100%;
    width: 100%;
`
const ModalText = styled.Text<{ isColored: boolean }>`
    color: ${props => props.isColored ? Colors.white : Colors.black};
    font-weight: ${Typography.weight._600.fontWeight};
    font-side: ${Typography.xSmall.fontSize}px;
`

interface ModalButtonProps {
    value: string
    onPress: () => void
    isColored?: boolean
}
const RoundedGeneralButton = (props: ModalButtonProps) => {
    const isColored = !!props.isColored
    return (
        <PressableStyled onPress={props.onPress} isColored={isColored}>
            <RoundedView isColored={isColored}>
                <ModalText isColored={isColored}>
                    {props.value}
                </ModalText>
            </RoundedView>
        </PressableStyled>
    )
}

export default RoundedGeneralButton
