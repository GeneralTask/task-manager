import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID, TRASH_SECTION_ID } from '../../constants'
import { usePreviewMode } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Subtitle } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import CalendarView from '../views/CalendarView'
import { useCalendarContext } from './CalendarContext'
import CalendarDropTask from './CalendarDropTask'
import CalendarSelector from './CalendarSelector'
import DropdownButton from './DropdownButton'
import { DEFAULT_CALENDAR_COLOR, calendarColors } from './utils/colors'

const SIDEBAR_WIDTH = '326px'
const ScheduleTaskSidebar = styled.div`
    width: ${SIDEBAR_WIDTH};
    padding: ${Spacing._24} ${Spacing._16};
    background-color: ${Colors.background.light};
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
`
const SidebarHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${Spacing._16};
`
const MarginDivider = styled(Divider)`
    margin: ${Spacing._16} 0;
`

const CalendarWithTaskSelection = () => {
    const { data: taskFolders } = useGetTasks()
    const { section: folderId } = useParams()
    const { calendarType, showTaskToCalSidebar, setShowTaskToCalSidebar } = useCalendarContext()
    const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false)
    const [folderIndex, setFolderIndex] = useState(0)
    const { isPreviewMode } = usePreviewMode()
    const validDragFolders =
        taskFolders?.filter((folder) => folder.id !== DONE_SECTION_ID && folder.id !== TRASH_SECTION_ID) ?? []

    const selectedFolder = taskFolders?.[folderIndex]
    const DropdownMenuItem =
        validDragFolders?.map((folder, index) => ({
            label: folder.name,
            onClick: () => setFolderIndex(index),
            icon: folder.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder,
            selected: index === folderIndex,
            count: folder.tasks.length,
        })) ?? []

    const triggerText = `${selectedFolder?.name || ''} (${selectedFolder?.tasks.length || 0})`

    useEffect(() => {
        const index = validDragFolders.findIndex((folder) => folder.id === folderId)
        if (index !== -1) setFolderIndex(index)
    }, [folderId])

    if (!taskFolders) return null
    return (
        <Flex>
            {calendarType === 'week' && showTaskToCalSidebar && (
                <ScheduleTaskSidebar>
                    <SidebarHeader>
                        <Subtitle>Schedule tasks</Subtitle>
                        <GTIconButton
                            icon={icons.x}
                            onClick={() => {
                                setShowTaskToCalSidebar(false)
                            }}
                            tooltipText="Hide task to calendar sidebar"
                        />
                    </SidebarHeader>
                    <Flex column gap={Spacing._8}>
                        <GTDropdownMenu
                            items={DropdownMenuItem}
                            trigger={<DropdownButton icon="folder" label={triggerText} />}
                            isOpen={isTaskDropdownOpen}
                            setIsOpen={setIsTaskDropdownOpen}
                            useTriggerWidth
                        />
                        {isPreviewMode && (
                            <>
                                <CalendarSelector
                                    mode="task-to-cal"
                                    renderTrigger={(calendar) => (
                                        <DropdownButton
                                            icon="square"
                                            iconColorHex={
                                                calendarColors[calendar?.color_id as keyof typeof calendarColors]
                                                    ?.background ?? DEFAULT_CALENDAR_COLOR
                                            }
                                            label={calendar?.title ?? 'Select a calendar'}
                                        />
                                    )}
                                    useTriggerWidth
                                />
                                <Flex justifyContent="end">
                                    <CalendarSelector
                                        mode="cal-selection"
                                        renderTrigger={() => (
                                            <GTIconButton icon={icons.eye} tooltipText="Show/hide calendars" asDiv />
                                        )}
                                    />
                                    <GTIconButton icon={icons.gear} tooltipText="Calendar settings" />
                                </Flex>
                            </>
                        )}
                    </Flex>
                    <MarginDivider color={Colors.border.light} />
                    {selectedFolder?.tasks.map((task) => (
                        <CalendarDropTask task={task} key={task.id} />
                    ))}
                </ScheduleTaskSidebar>
            )}
            <CalendarView initialType="day" />
        </Flex>
    )
}

export default CalendarWithTaskSelection
