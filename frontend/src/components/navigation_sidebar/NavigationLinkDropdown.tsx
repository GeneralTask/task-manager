import React, { CSSProperties, ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { margin } from '../../styles/spacing'
import { Icon } from '../atoms/Icon'

const DropdownContainer = styled.div<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;

    border-radius: ${Border.radius.small};
    border-width: 2px;
    border-style: solid;
    border-color: transparent;
    gap: ${margin._8}px;
    ${(props) => props.isSelected && `background-color: ${Colors.gray._50};`};
`
const LinksContainer = styled.div`
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    margin-left: ${Spacing.margin._24}px;
`
const SectionTitle = styled.span<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? Typography.weight._600 : Typography.weight._500)};
    font-size: ${Typography.xSmall.fontSize};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
`
const linkStyle: CSSProperties = {
    textDecorationLine: 'none',
    width: '100%',
}

interface NavigationLinkDropdownProps {
    children: ReactNode
    isCurrentPage: boolean
    link: string
    title: string
    icon?: string
}
const NavigationLinkDropdown = ({ children, isCurrentPage, link, title, icon }: NavigationLinkDropdownProps) => {
    const [isOpen, setIsOpen] = useState(true)
    const onNavigate = () => {
        setIsOpen(!isOpen)
    }

    return (
        <>
            <Link style={linkStyle} to={link} onClick={onNavigate}>
                <DropdownContainer isSelected={isCurrentPage}>
                    <Icon size="xSmall" source={isOpen ? icons.chevron_down : icons.caret_right} />
                    <Icon size="small" source={icon} />
                    <SectionTitle isSelected={isCurrentPage}>{title}</SectionTitle>
                </DropdownContainer>
            </Link>
            {isOpen && <LinksContainer>{children}</LinksContainer>}
        </>
    )
}

export default NavigationLinkDropdown
