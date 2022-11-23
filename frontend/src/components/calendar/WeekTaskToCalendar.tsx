import { useState } from 'react'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID, DONE_SECTION_ID, TRASH_SECTION_ID } from '../../constants'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import BaseModal, { BaseModalProps } from '../atoms/BaseModal'
import { Divider } from '../atoms/SectionDivider'
import { Subtitle } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import CalendarView from '../views/CalendarView'
import CalendarDropTask from './CalendarDropTask'
import DropdownButton from './DropdownButton'

const MODAL_VIEW_HEIGHT = '750px'
const SIDEBAR_WIDTH = '326px'
const TaskToCalendarContainer = styled.div`
    display: flex;
    height: ${MODAL_VIEW_HEIGHT};
`
const CalendarAndHeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`
const CalendarViewContainer = styled.div`
    height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    flex: 1;
`
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

const WeekTaskToCalendar = (props: BaseModalProps) => {
    const { data: sections } = useGetTasks()
    const [isOpen, setIsOpen] = useState(false)
    const [sectionIndex, setSectionIndex] = useState(0)

    const validDragSections =
        sections?.filter((section) => section.id !== DONE_SECTION_ID && section.id !== TRASH_SECTION_ID) ?? []
    const selectedSeciton = sections?.[sectionIndex]
    const DropdownMenuItem =
        validDragSections?.map((section, index) => ({
            label: section.name,
            onClick: () => setSectionIndex(index),
            icon: section.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder,
            selected: index === sectionIndex,
        })) ?? []

    const triggerText = `${selectedSeciton?.name || ''} (${selectedSeciton?.tasks.length || 0})`
    if (!sections) return null
    return (
        <BaseModal {...props}>
            <TaskToCalendarContainer>
                <ScheduleTaskSidebar>
                    <SidebarHeader>Schedule tasks</SidebarHeader>
                    <GTDropdownMenu
                        menuInModal
                        items={DropdownMenuItem}
                        trigger={<DropdownButton label={triggerText} />}
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                        useTriggerWidth
                    />
                    <MarginDivider color={Colors.border.light} />
                    {selectedSeciton?.tasks.map((task) => (
                        <CalendarDropTask task={task} key={task.id} />
                    ))}
                </ScheduleTaskSidebar>
                <CalendarAndHeaderContainer>
                    <CalendarViewContainer>
                        <CalendarView
                            initialType="week"
                            ignoreCalendarContext
                            initialShowMainHeader={false}
                            hasLeftBorder={true}
                            hideContainerShadow={false}
                        />
                    </CalendarViewContainer>
                </CalendarAndHeaderContainer>
            </TaskToCalendarContainer>
        </BaseModal>
    )
}

export default WeekTaskToCalendar
