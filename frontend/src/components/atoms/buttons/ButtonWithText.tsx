import React from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { Icon, TIconType } from '../Icon'

const ButtonWithTextContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    color: ${Colors.text.light};
    ${Typography.mini};
    cursor: pointer;
    user-select: none;
    padding: ${Spacing._8} ${Spacing._8};
    width: fit-content;
    border: ${Border.stroke.small} solid transparent;
    :hover {
        border-color: ${Colors.border.light};
        border-radius: ${Border.radius.small};
    }
`

interface ButtonWithTextProps {
    icon: TIconType
    text: string
    clickHandler: (e: React.MouseEvent<HTMLDivElement>) => void
    className?: string
}
const ButtonWithText = ({ icon, text, clickHandler, className }: ButtonWithTextProps) => {
    return (
        <ButtonWithTextContainer onClick={clickHandler} className={className}>
            <Icon icon={icon} color="gray" />
            <span>{text}</span>
        </ButtonWithTextContainer>
    )
}

export default ButtonWithText
