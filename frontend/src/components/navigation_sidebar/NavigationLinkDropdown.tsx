import React, { ReactNode, useState } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { margin } from '../../styles/spacing'
import { Icon } from '../atoms/Icon'

const DropdownContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    border-radius: ${Border.radius.small};
    border: 2px solid transparent;
    gap: ${margin._8}px;
    cursor: pointer;
`
const LinksContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: ${Spacing.margin._24}px;
`
const SectionTitle = styled.span`
    font-weight: ${Typography.weight._500};
    font-size: ${Typography.xSmall.fontSize};
    color: ${Colors.gray._500};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
`

interface NavigationLinkDropdownProps {
    children: ReactNode
    title: string
}
const NavigationLinkDropdown = ({ children, title }: NavigationLinkDropdownProps) => {
    const [isOpen, setIsOpen] = useState(true)
    const onClickHandler = () => setIsOpen(!isOpen)

    return (
        <>
            <DropdownContainer onClick={onClickHandler}>
                <Icon size="xSmall" source={isOpen ? icons.chevron_down : icons.caret_right} />
                <Icon size="small" source={icons.inbox} />
                <SectionTitle>{title}</SectionTitle>
            </DropdownContainer>
            {isOpen && <LinksContainer>{children}</LinksContainer>}
        </>
    )
}

export default NavigationLinkDropdown
