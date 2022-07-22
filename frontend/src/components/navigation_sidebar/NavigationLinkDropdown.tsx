import { Border, Colors, Spacing, Typography } from '../../styles'
import React, { ReactNode, useState } from 'react'
import { TIconImage, icons } from '../../styles/images'

import { Icon } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { margin } from '../../styles/spacing'
import styled from 'styled-components'

const DropdownContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    border: 2px solid transparent;
    gap: ${margin._8};
    cursor: pointer;
`
const LinksContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: ${Spacing.margin._24};
`
const SectionTitle = styled.span`
    font-weight: ${Typography.weight._500};
    font-size: ${Typography.xSmall.fontSize};
    color: ${Colors.text.light};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
`
const AddSectionContainer = styled.div`
    padding: ${Spacing.padding._4};
    border-radius: 50%;
    &:hover {
        background-color: ${Colors.background.dark};
    }
`

interface NavigationLinkDropdownProps {
    children: ReactNode
    title: string
    icon: TIconImage
    openAddSectionInput?: () => void
}
const NavigationLinkDropdown = ({ children, title, icon, openAddSectionInput }: NavigationLinkDropdownProps) => {
    const [isOpen, setIsOpen] = useState(true)
    const onClickHandler = () => setIsOpen(!isOpen)
    const openAddSectionHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (!openAddSectionInput) return
        openAddSectionInput()
        setIsOpen(true)
    }

    return (
        <>
            <DropdownContainer onClick={onClickHandler}>
                <Icon size="xSmall" source={isOpen ? icons.chevron_down : icons.caret_right_sidebar} />
                <Icon size="small" source={icons[icon]} />
                <SectionTitle>{title}</SectionTitle>
                {openAddSectionInput && (
                    <AddSectionContainer onClick={openAddSectionHandler} data-testid="add-section-button">
                        <TooltipWrapper dataTip="Add Section" tooltipId="tooltip">
                            <Icon size="small" source={icons.plus} />
                        </TooltipWrapper>
                    </AddSectionContainer>
                )}
            </DropdownContainer>
            {isOpen && <LinksContainer>{children}</LinksContainer>}
        </>
    )
}

export default NavigationLinkDropdown
