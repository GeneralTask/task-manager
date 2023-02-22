import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import {
    DEFAULT_FOLDER_ID,
    DONE_FOLDER_ID,
    DONE_FOLDER_NAME,
    TASK_INBOX_NAME,
    TRASH_FOLDER_ID,
    TRASH_FOLDER_NAME,
} from '../../constants'
import { usePreviewMode } from '../../hooks'
import { useGetFolders } from '../../services/api/folders.hooks'
import Log from '../../services/api/log'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { Colors, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from '../calendar/CalendarContext'
import CommandPalette from '../molecules/CommandPalette'
import FeedbackModal from '../molecules/FeedbackModal'
import SettingsModalButton from '../molecules/SettingsModalButton'
import IntegrationLinks from '../navigation_sidebar/IntegrationLinks'
import NavigationLink, { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import NoteCreateButton from '../notes/NoteCreateButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'
import Tip from '../radix/Tip'

const PositionedIcon = styled(Icon)`
    margin-bottom: ${Spacing._32};
`
const CollapseAndCommandPaletteContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: ${Spacing._32};
    gap: ${Spacing._8};
`
const CollapsedContainer = styled.div`
    padding: ${Spacing._24} 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    box-sizing: border-box;
`
const FoldersContainer = styled.div<{ isCollapsed?: boolean }>`
    margin-top: ${Spacing._32};
    display: flex;
    flex-direction: column;
    ${({ isCollapsed }) => isCollapsed && `gap: ${Spacing._8};`}
`
const UpperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const MiddleContainer = styled.div`
    overflow-y: auto;
    flex: 1;
`
const LowerContainer = styled.div`
    margin-top: auto;
    margin-bottom: auto;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
const NOT_DROPDOWN_MENU_ITEM_IDs = [DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID]
const Beta = styled.div<{ isPreviewMode: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin: 0 auto;
    background-color: ${Colors.icon.gray};
    color: ${Colors.text.black};
    user-select: none;
    cursor: pointer;
    border-radius: 50%;
    aspect-ratio: 1/1;
    width: 40px;
    ${(props) =>
        props.isPreviewMode &&
        css`
            background-color: ${Colors.text.purple};
            color: ${Colors.text.white};
        `}
`

interface NavigationViewCollapsedProps {
    setIsCollapsed: (isCollapsed: boolean) => void
}
const NavigationViewCollapsed = ({ setIsCollapsed }: NavigationViewCollapsedProps) => {
    const { data: folders } = useGetFolders()
    const { section: sectionId } = useParams()
    const { showTaskToCalSidebar, setShowTaskToCalSidebar, calendarType } = useCalendarContext()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const { isPreviewMode, toggle: togglePreviewMode } = usePreviewMode()
    const navigate = useNavigate()

    const DEFAULT_FOLDER = folders?.find((folder) => folder.id === DEFAULT_FOLDER_ID)
    const TRASH_FOLDER = folders?.find((folder) => folder.id === TRASH_FOLDER_ID)
    const DONE_FOLDER = folders?.find((folder) => folder.id === DONE_FOLDER_ID)

    const filteredFolders = folders?.filter((folder) => !NOT_DROPDOWN_MENU_ITEM_IDs.includes(folder.id)) ?? []
    const filteredFoldersIds = filteredFolders?.map((folder) => folder.id) ?? []

    const items: GTMenuItem[] =
        filteredFolders?.map((folder) => ({
            label: `${folder.name} (${folder.task_ids.length})`,
            onClick: () => {
                if (!showTaskToCalSidebar && calendarType === 'week') {
                    setShowTaskToCalSidebar(true)
                }
                Log(`navigate__/tasks/${folder.id}`)
                navigate(`/tasks/${folder.id}`)
            },
            icon: icons.folder,
        })) ?? []
    const { data: userInfo } = useGetUserInfo()

    return (
        <CollapsedContainer>
            <UpperContainer>
                <PositionedIcon
                    icon={isPreviewMode ? logos.generaltask_blue_circle : logos.generaltask_yellow_circle}
                    size="medium"
                />
                <CollapseAndCommandPaletteContainer>
                    <Tip shortcutName="navigationView" side="right">
                        <CollapsedIconContainer onClick={() => setIsCollapsed(false)}>
                            <Icon icon={icons.sidebar} />
                        </CollapsedIconContainer>
                    </Tip>
                    <NoteCreateButton type="collapsed" />
                    <CommandPalette
                        customButton={
                            <Tip shortcutName="toggleCommandPalette" side="right">
                                <CollapsedIconContainer>
                                    <Icon icon={icons.magnifying_glass} />
                                </CollapsedIconContainer>
                            </Tip>
                        }
                    />
                </CollapseAndCommandPaletteContainer>
            </UpperContainer>
            <MiddleContainer>
                <IntegrationLinks isCollapsed />
                <FoldersContainer isCollapsed>
                    {DEFAULT_FOLDER && (
                        <Tip shortcutName="goToTaskInbox" side="right">
                            <NavigationLink
                                link={`/tasks/${DEFAULT_FOLDER_ID}`}
                                title={TASK_INBOX_NAME}
                                icon={icons.inbox}
                                isCurrentPage={sectionId === DEFAULT_FOLDER_ID}
                                taskFolder={DEFAULT_FOLDER}
                                count={DEFAULT_FOLDER.task_ids.length}
                                isCollapsed
                                droppable
                            />
                        </Tip>
                    )}
                    {items.length > 0 && (
                        <GTDropdownMenu
                            items={items}
                            isOpen={isDropdownOpen}
                            side="right"
                            setIsOpen={setIsDropdownOpen}
                            unstyledTrigger
                            hideCheckmark
                            trigger={
                                <CollapsedIconContainer isSelected={filteredFoldersIds.includes(sectionId || '')}>
                                    <Icon icon={icons.folder} />
                                </CollapsedIconContainer>
                            }
                        />
                    )}
                    {DONE_FOLDER && (
                        <NavigationLink
                            link={`/tasks/${DONE_FOLDER_ID}`}
                            title={DONE_FOLDER_NAME}
                            icon={icons.checkbox_checked}
                            isCurrentPage={sectionId === DONE_FOLDER_ID}
                            taskFolder={DONE_FOLDER}
                            count={DONE_FOLDER.task_ids.length}
                            isCollapsed
                            droppable
                        />
                    )}
                    {TRASH_FOLDER && (
                        <NavigationLink
                            link={`/tasks/${TRASH_FOLDER_ID}`}
                            title={TRASH_FOLDER_NAME}
                            icon={icons.trash}
                            isCurrentPage={sectionId === TRASH_FOLDER_ID}
                            taskFolder={TRASH_FOLDER}
                            count={TRASH_FOLDER.task_ids.length}
                            isCollapsed
                            droppable
                        />
                    )}
                </FoldersContainer>
            </MiddleContainer>
            <LowerContainer>
                <FeedbackModal isCollapsed />
                <SettingsModalButton type="collapsed-nav-button" />
                {userInfo?.is_employee && (
                    <Beta isPreviewMode={isPreviewMode} onClick={() => togglePreviewMode()}>
                        {isPreviewMode ? 'GK' : 'GT'}
                    </Beta>
                )}
            </LowerContainer>
        </CollapsedContainer>
    )
}

export default NavigationViewCollapsed
