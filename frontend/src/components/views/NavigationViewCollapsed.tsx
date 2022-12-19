import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import {
    DEFAULT_SECTION_ID,
    DONE_FOLDER_NAME,
    DONE_SECTION_ID,
    TASK_INBOX_NAME,
    TRASH_FOLDER_NAME,
    TRASH_SECTION_ID,
} from '../../constants'
import { usePreviewMode } from '../../hooks'
import Log from '../../services/api/log'
import { useGetTasks } from '../../services/api/tasks.hooks'
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
`
const CollapsedContainer = styled.div`
    padding: ${Spacing._24} 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    box-sizing: border-box;
`
const FoldersContainer = styled.div`
    margin-top: ${Spacing._32};
    display: flex;
    flex-direction: column;
`
const UpperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const MiddleContainer = styled.div`
    overflow-y: auto;
`
const LowerContainer = styled.div`
    margin-top: auto;
    padding-top: ${Spacing._32};
    margin-bottom: auto;
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
const NOT_DROPDOWN_MENU_ITEM_IDs = [DEFAULT_SECTION_ID, DONE_SECTION_ID, TRASH_SECTION_ID]
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
    const { data: folders } = useGetTasks()
    const { section: sectionId } = useParams()
    const { setCalendarType, setDate, dayViewDate } = useCalendarContext()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const navigate = useNavigate()

    const DEFAULT_FOLDER = folders?.find((folder) => folder.id === DEFAULT_SECTION_ID)
    const TRASH_FOLDER = folders?.find((folder) => folder.id === TRASH_SECTION_ID)
    const DONE_FOLDER = folders?.find((folder) => folder.id === DONE_SECTION_ID)

    const filteredFolders = folders?.filter((folder) => !NOT_DROPDOWN_MENU_ITEM_IDs.includes(folder.id)) ?? []
    const filteredFoldersIds = filteredFolders?.map((folder) => folder.id) ?? []

    const items: GTMenuItem[] =
        filteredFolders?.map((folder) => ({
            label: `${folder.name} (${folder.tasks.length})`,
            onClick: () => {
                setCalendarType('day')
                setDate(dayViewDate)
                Log(`navigate__/tasks/${folder.id}`)
                navigate(`/tasks/${folder.id}`)
            },
            icon: icons.folder,
        })) ?? []
    const { data: userInfo } = useGetUserInfo()
    const { isPreviewMode, toggle: togglePreviewMode } = usePreviewMode()

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
                <FoldersContainer>
                    {DEFAULT_FOLDER && (
                        <NavigationLink
                            link={`/tasks/${DEFAULT_SECTION_ID}`}
                            title={TASK_INBOX_NAME}
                            icon={icons.inbox}
                            isCurrentPage={sectionId === DEFAULT_SECTION_ID}
                            taskSection={DEFAULT_FOLDER}
                            count={DEFAULT_FOLDER.tasks.length}
                            isCollapsed
                            droppable
                        />
                    )}
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
                    {TRASH_FOLDER && (
                        <NavigationLink
                            link={`/tasks/${TRASH_SECTION_ID}`}
                            title={TRASH_FOLDER_NAME}
                            icon={icons.trash}
                            isCurrentPage={sectionId === TRASH_SECTION_ID}
                            taskSection={TRASH_FOLDER}
                            count={TRASH_FOLDER.tasks.length}
                            isCollapsed
                            droppable
                        />
                    )}
                    {DONE_FOLDER && (
                        <NavigationLink
                            link={`/tasks/${DONE_SECTION_ID}`}
                            title={DONE_FOLDER_NAME}
                            icon={icons.checkbox_checked}
                            isCurrentPage={sectionId === DONE_SECTION_ID}
                            taskSection={DONE_FOLDER}
                            count={DONE_FOLDER.tasks.length}
                            isCollapsed
                            droppable
                        />
                    )}
                </FoldersContainer>
            </MiddleContainer>
            <LowerContainer>
                <FeedbackModal isCollapsed />
                <SettingsModalButton isCollapsed />
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
