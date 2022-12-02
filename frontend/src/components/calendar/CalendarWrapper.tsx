import { useState } from 'react'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID, TRASH_SECTION_ID } from '../../constants'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Divider } from '../atoms/SectionDivider'
import { Subtitle } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import CalendarView from '../views/CalendarView'
import { useCalendarContext } from './CalendarContext'
import CalendarDropTask from './CalendarDropTask'
import DropdownButton from './DropdownButton'

const SIDEBAR_WIDTH = '326px'
const ScheduleTaskSidebar = styled.div`
    width: ${SIDEBAR_WIDTH};
    padding: ${Spacing._24} ${Spacing._16};
    background-color: ${Colors.background.light};
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
`
const SidebarHeader = styled(Subtitle)`
    display: block;
    user-select: none;
    margin-bottom: ${Spacing._16};
`
const MarginDivider = styled(Divider)`
    margin: ${Spacing._16} 0;
`

const CalendarWrapper = () => {
    const { data: sections } = useGetTasks()
    const { calendarType, showTaskToCalSidebar } = useCalendarContext()
    const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false)
    const [sectionIndex, setSectionIndex] = useState(0)
    const validDragSections =
        sections?.filter((section) => section.id !== DONE_SECTION_ID && section.id !== TRASH_SECTION_ID) ?? []

    const selectedSection = sections?.[sectionIndex]
    const DropdownMenuItem =
        validDragSections?.map((section, index) => ({
            label: section.name,
            onClick: () => setSectionIndex(index),
            icon: section.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder,
            selected: index === sectionIndex,
            count: section.tasks.length,
        })) ?? []

    const triggerText = `${selectedSection?.name || ''} (${selectedSection?.tasks.length || 0})`
    if (!sections) return null
    return (
        <Flex>
            {calendarType === 'week' && showTaskToCalSidebar && (
                <ScheduleTaskSidebar>
                    <SidebarHeader>Schedule tasks</SidebarHeader>
                    <GTDropdownMenu
                        items={DropdownMenuItem}
                        trigger={<DropdownButton label={triggerText} />}
                        isOpen={isTaskDropdownOpen}
                        setIsOpen={setIsTaskDropdownOpen}
                        useTriggerWidth
                    />
                    <MarginDivider color={Colors.border.light} />
                    {selectedSection?.tasks.map((task) => (
                        <CalendarDropTask task={task} key={task.id} />
                    ))}
                </ScheduleTaskSidebar>
            )}
            {/* <CalendarAndHeaderContainer>
                <CalendarViewContainer> */}
            <CalendarView
                initialType="day"
                // initialShowMainHeader={false}
                // hasLeftBorder={true}
                // hideContainerShadow={false}
            />
            {/* </CalendarViewContainer>
            </CalendarAndHeaderContainer> */}
        </Flex>
    )
}

export default CalendarWrapper
