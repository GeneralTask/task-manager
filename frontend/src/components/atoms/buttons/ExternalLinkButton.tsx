import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
import React from 'react'
import styled from 'styled-components'
import { Icon } from '../Icon'
import { icons, TIconImage } from '../../../styles/images'

const Button = styled.button`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    padding: 6px 10px;
    gap: 6px;

    width: 280px;
    height: 42px;

    background: ${Colors.background.white};
    border: 1px solid ${Colors.button.secondary.hover};
    box-shadow: ${Shadows.button.default};
    border-radius: ${Border.radius.medium};
    cursor: pointer;

    color: ${Colors.text.black};
    ${Typography.label};
`

interface LinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    iconSource?: TIconImage
}

const ExternalLinkButton = (props: LinkButtonProps) => {
    return (
        <Button>
            {props.iconSource && <Icon size="xSmall" source={icons[props.iconSource]} />}
            {props.value}
        </Button>
    )
}

export default ExternalLinkButton
