import { ReactNode } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import Tip from '../radix/Tip'

const DropdownContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._16} 0 ${Spacing._4};
    border-radius: ${Border.radius.small};
    border: ${Border.stroke.large} solid transparent;
`
const LinksContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`
const SectionTitle = styled.span`
    color: ${Colors.text.black};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.eyebrow};
`
const AddSectionContainer = styled.div`
    padding: ${Spacing._4};
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
                    <Tip content="Add Folder">
                        <AddSectionContainer onClick={openAddSectionHandler}>
                            <Icon icon={icons.plus} color="black" />
                        </AddSectionContainer>
                    </Tip>
                )}
            </DropdownContainer>
            <LinksContainer>{children}</LinksContainer>
        </>
    )
}

export default NavigationLinkDropdown
