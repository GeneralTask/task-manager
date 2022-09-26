import { ReactNode } from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'

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
const FolderTitle = styled.span`
    color: ${Colors.text.black};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.eyebrow};
`
const AddFolderContainer = styled.div`
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
    openAddFolderInput?: () => void
}
const NavigationLinkDropdown = ({ children, title, openAddFolderInput }: NavigationLinkDropdownProps) => {
    const openAddFolderHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (!openAddFolderInput) return
        openAddFolderInput()
    }

    return (
        <>
            <DropdownContainer>
                <FolderTitle>{title}</FolderTitle>
                {openAddFolderInput && (
                    <AddFolderContainer onClick={openAddFolderHandler} data-testid="add-folder-button">
                        <TooltipWrapper dataTip="Add Folder" tooltipId="tooltip">
                            <Icon size="xSmall" icon={icons.plus} color={Colors.icon.black} />
                        </TooltipWrapper>
                    </AddFolderContainer>
                )}
            </DropdownContainer>
            <LinksContainer>{children}</LinksContainer>
        </>
    )
}

export default NavigationLinkDropdown
