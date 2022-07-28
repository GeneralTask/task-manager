import { Border, Colors, Spacing, Typography } from '../../styles'
import React, { ReactNode } from 'react'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'
import styled from 'styled-components'

const DropdownContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    border: ${Border.stroke.large} solid transparent;
    gap: ${Spacing.margin._8};
`
const LinksContainer = styled.div`
    display: flex;
    flex-direction: column;
`
const SectionTitle = styled.span`
    color: ${Colors.text.light};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.eyebrow};
`
const AddSectionContainer = styled.div`
    padding: ${Spacing.padding._4};
    border-radius: 50%;
    &:hover {
        background-color: ${Colors.background.dark};
    }
    cursor: pointer;
`

interface NavigationLinkDropdownProps {
    children: ReactNode
    title: string
    openAddSectionInput?: () => void
}
const NavigationLinkDropdown = ({ children, title, openAddSectionInput }: NavigationLinkDropdownProps) => {
    const openAddSectionHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (!openAddSectionInput) return
        openAddSectionInput()
    }

    return (
        <>
            <DropdownContainer>
                <SectionTitle>{title}</SectionTitle>
                {openAddSectionInput && (
                    <AddSectionContainer onClick={openAddSectionHandler} data-testid="add-section-button">
                        <TooltipWrapper dataTip="Add Section" tooltipId="tooltip">
                            <Icon size="xSmall" source={icons.plus} />
                        </TooltipWrapper>
                    </AddSectionContainer>
                )}
            </DropdownContainer>
            <LinksContainer>{children}</LinksContainer>
        </>
    )
}

export default NavigationLinkDropdown
