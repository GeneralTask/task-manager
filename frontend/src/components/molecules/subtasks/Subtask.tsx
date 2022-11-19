import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { useNavigateToTask } from '../../../hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { DropType, TTask } from '../../../utils/types'
import Domino from '../../atoms/Domino'
import MarkTaskDoneButton from '../../atoms/buttons/MarkTaskDoneButton'
import TaskContextMenuWrapper from '../../radix/TaskContextMenuWrapper'

export const SubtaskDropOffset = styled.div`
    width: 100%;
    padding: 2px 0;
`
export const SubtaskContainer = styled.div<{ forceHoverStyle?: boolean }>`
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
    ${({ forceHoverStyle }) => forceHoverStyle && `background-color: ${Colors.background.medium};`}
    user-select: none;
    width: 100%;
    box-sizing: border-box;
`

interface SubtaskProps {
    parentTaskId: string
    subtask: TTask
}
const Subtask = ({ parentTaskId, subtask }: SubtaskProps) => {
    const navigateToTask = useNavigateToTask()
    const [isVisible, setIsVisible] = useState(false)

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

    const [contextMenuOpen, setContextMenuOpen] = useState(false)

    return (
        <SubtaskDropOffset>
            <TaskContextMenuWrapper task={subtask} onOpenChange={setContextMenuOpen}>
                <SubtaskContainer
                    onClick={() => navigateToTask(parentTaskId, subtask.id)}
                    ref={drag}
                    {...visibilityToggle}
                    forceHoverStyle={contextMenuOpen}
                >
                    <Domino isVisible={isVisible} />
                    <MarkTaskDoneButton
                        isDone={subtask.is_done}
                        taskId={parentTaskId}
                        subtaskId={subtask.id}
                        isSelected={false}
                    />
                    {subtask.title}
                </SubtaskContainer>
            </TaskContextMenuWrapper>
        </SubtaskDropOffset>
    )
}

export default Subtask
