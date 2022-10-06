import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from './CalendarContext'

const TasksDueHeaderContainer = styled.div`
    ${Typography.bodySmall};
    display: flex;
    gap: ${Spacing._12};
    align-items: center;
    color: ${Colors.text.light};
    cursor: pointer;
    user-select: none;
`
const CaretContainer = styled.div`
    margin-left: auto;
    margin-right: ${Spacing._8};
`
interface TasksDueHeaderProps {
    type: 'day' | 'week'
    numTasksDue: number
    hideCollapseButton?: boolean
}
const TasksDueHeader = ({ type, numTasksDue, hideCollapseButton }: TasksDueHeaderProps) => {
    const { isTasksDueViewCollapsed, setIsTasksDueViewCollapsed } = useCalendarContext()
    const caretIcon = isTasksDueViewCollapsed ? icons.caret_right : icons.caret_down
    const dayMessage = `Due Today (${numTasksDue})`
    const weekMessage = numTasksDue === 1 ? `1 Task Due` : `${numTasksDue} Tasks Due`
    const message = type === 'day' ? dayMessage : weekMessage

    return (
        <TasksDueHeaderContainer
            onClick={() => {
                setIsTasksDueViewCollapsed(!isTasksDueViewCollapsed)
            }}
        >
            <Icon icon={icons.clock} color="gray" />
            <span>{message}</span>
            {!hideCollapseButton && (
                <CaretContainer>
                    <Icon icon={caretIcon} color="gray" />
                </CaretContainer>
            )}
        </TasksDueHeaderContainer>
    )
}

export default TasksDueHeader
