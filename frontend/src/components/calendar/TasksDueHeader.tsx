import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'

const TasksDueHeaderContainer = styled.div`
    ${Typography.eyebrow};
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
    isCollapsed: boolean
    setIsCollapsed: (isCollapsed: boolean) => void
    numTasksDue: number
    hideCollapseButton?: boolean
}
const TasksDueHeader = ({
    type,
    isCollapsed,
    setIsCollapsed,
    numTasksDue,
    hideCollapseButton,
}: TasksDueHeaderProps) => {
    const caretIcon = isCollapsed ? icons.caret_right : icons.caret_down
    const dayMessage = `Due Today (${numTasksDue})`
    const weekMessage = numTasksDue === 1 ? `1 Task Due` : `${numTasksDue} Tasks Due`
    const message = type === 'day' ? dayMessage : weekMessage

    return (
        <TasksDueHeaderContainer
            onClick={() => {
                setIsCollapsed(!isCollapsed)
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
