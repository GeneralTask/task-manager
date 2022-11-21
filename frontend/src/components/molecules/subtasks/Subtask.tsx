import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { TASK_PRIORITIES } from '../../../constants'
import { useNavigateToTask } from '../../../hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { DropType, TTask } from '../../../utils/types'
import Domino from '../../atoms/Domino'
import DueDate from '../../atoms/DueDate'
import { Icon } from '../../atoms/Icon'
import MarkTaskDoneButton from '../../atoms/buttons/MarkTaskDoneButton'

export const SubtaskDropOffset = styled.div`
    width: 100%;
    padding: 2px 0;
`
export const RightContainer = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
`
export const SubtaskContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    border: ${Border.stroke.small} solid ${Colors.border.light};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._16};
    ${Typography.body};
    cursor: pointer;
    :hover {
        background-color: ${Colors.background.medium};
    }
    user-select: none;
    width: 100%;
    box-sizing: border-box;
`
const TitleSpan = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

interface SubtaskProps {
    parentTaskId: string
    subtask: TTask
}
const Subtask = ({ parentTaskId, subtask }: SubtaskProps) => {
    const navigateToTask = useNavigateToTask()
    const [isVisible, setIsVisible] = useState(false)
    const dueDate = DateTime.fromISO(subtask.due_date).toJSDate()

    const visibilityToggle = {
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
    }

    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.SUBTASK,
            item: { id: subtask.id, task: subtask },
            canDrag: true,
        }),
        [subtask]
    )
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    return (
        <SubtaskDropOffset>
            <SubtaskContainer onClick={() => navigateToTask(parentTaskId, subtask.id)} ref={drag} {...visibilityToggle}>
                <Domino isVisible={isVisible} />
                <MarkTaskDoneButton
                    isDone={subtask.is_done}
                    taskId={parentTaskId}
                    subtaskId={subtask.id}
                    isSelected={false}
                />
                <TitleSpan>{subtask.title}</TitleSpan>
                <RightContainer>
                    <DueDate date={dueDate} />
                    {subtask.priority_normalized !== 0 && (
                        <Icon
                            icon={TASK_PRIORITIES[subtask.priority_normalized].icon}
                            color={TASK_PRIORITIES[subtask.priority_normalized].color}
                        />
                    )}
                </RightContainer>
            </SubtaskContainer>
        </SubtaskDropOffset>
    )
}

export default Subtask
