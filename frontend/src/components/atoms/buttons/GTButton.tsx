import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import React from 'react'
import styled from 'styled-components'
import { Icon } from '../Icon'
import { icons, TIconImage } from '../../../styles/images'

const Button = styled.button<{ styleType: 'primary' | 'secondary'; wrapText?: boolean }>`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: ${Spacing.margin._4};
    border-radius: ${Border.radius.small};
    background-color: ${(props) =>
        props.styleType === 'primary' ? Colors.button.primary.default : Colors.button.secondary.default};
    padding: ${Spacing.padding._8} ${Spacing.padding._12};
    border: none;
    text-align: center;
    height: 100%;
    color: ${(props) => (props.styleType === 'primary' ? Colors.white : Colors.black)};
    box-shadow: ${Shadows.button.default};
    font-weight: ${Typography.weight._600};
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    white-space: ${(props) => (props.wrapText ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: background 0.05s;
    transition: box-shadow 0.25s;
    user-select: none;
    &:hover {
        box-shadow: ${(props) =>
            props.styleType === 'primary' ? Shadows.button.primary.hover : Shadows.button.secondary.hover};
        background-color: ${(props) =>
            props.styleType === 'primary' ? Colors.button.primary.hover : Colors.button.secondary.hover};
    }
    &:active {
        box-shadow: ${(props) =>
            props.styleType === 'primary' ? Shadows.button.primary.active : Shadows.button.secondary.active};
        color: ${(props) =>
            props.styleType === 'primary' ? Colors.button.primary.active_text : Colors.button.secondary.active_text};
    }
`

interface GTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    styleType?: 'primary' | 'secondary'
    wrapText?: boolean
    iconSource?: TIconImage
}
const GTButton = (props: GTButtonProps) => {
    return (
        <Button styleType={props.styleType || 'primary'} wrapText={props.wrapText} {...props}>
            {props.iconSource && <Icon size="small" source={icons[props.iconSource]} />}
            {props.value}
        </Button>
    )
}

export default GTButton
