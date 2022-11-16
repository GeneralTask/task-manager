import styled from 'styled-components'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Eyebrow } from '../atoms/typography/Typography'
import { useCalendarContext } from './CalendarContext'

const TasksDueHeaderContainer = styled.div`
    display: flex;
    gap: ${Spacing._12};
    align-items: center;
    cursor: pointer;
    user-select: none;
`
const CaretContainer = styled.div`
    margin-left: auto;
`
interface TasksDueHeaderProps {
    type: 'day' | 'week'
    dueType: 'due' | 'overdue'
    numTasksDue: number
    hideCollapseButton?: boolean
}
const TasksDueHeader = ({ type, dueType, numTasksDue, hideCollapseButton }: TasksDueHeaderProps) => {
    const {
        isTasksDueViewCollapsed,
        setIsTasksDueViewCollapsed,
        isTasksOverdueViewCollapsed,
        setIsTasksOverdueViewCollapsed,
    } = useCalendarContext()
    const isCollapsed = dueType === 'due' ? isTasksDueViewCollapsed : isTasksOverdueViewCollapsed
    const caretIcon = isCollapsed ? icons.caret_right : icons.caret_down
    const dayMessage = dueType === 'due' ? `Due Today (${numTasksDue})` : `Overdue (${numTasksDue})`
    const weekMessage = numTasksDue === 1 ? `1 Task Due` : `${numTasksDue} Tasks Due`
    const message = type === 'day' ? dayMessage : weekMessage

    return (
        <TasksDueHeaderContainer
            onClick={() => {
                if (dueType === 'due') {
                    setIsTasksDueViewCollapsed(!isTasksDueViewCollapsed)
                } else {
                    setIsTasksOverdueViewCollapsed(!isTasksOverdueViewCollapsed)
                }
            }}
        >
            <Icon icon={icons.clock} color={dueType === 'due' ? 'gray' : 'red'} />
            <Eyebrow color={dueType === 'due' ? 'light' : 'red'}>{message}</Eyebrow>
            {!hideCollapseButton && (
                <CaretContainer>
                    <Icon icon={caretIcon} color={dueType === 'due' ? 'gray' : 'red'} />
                </CaretContainer>
            )}
        </TasksDueHeaderContainer>
    )
}

export default TasksDueHeader
