import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DateTime } from 'luxon'
import styled, { css, keyframes } from 'styled-components'
import { TASK_PRIORITIES } from '../../../constants'
import { useNavigateToTask } from '../../../hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { DropType, TTask } from '../../../utils/types'
import Domino from '../../atoms/Domino'
import DueDate from '../../atoms/DueDate'
import { Icon } from '../../atoms/Icon'
import MarkTaskDoneButton from '../../atoms/buttons/MarkTaskDoneButton'
import TaskContextMenuWrapper from '../../radix/TaskContextMenuWrapper'

const strike = keyframes`
    0% { width: 0; }
    100% { width: 100%; }
`

export const SubtaskDropOffset = styled.div`
    width: 100%;
    padding: 2px 0;
`
export const RightContainer = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    white-space: nowrap;
`
export const SubtaskContainer = styled.div<{ forceHoverStyle?: boolean; isDone?: boolean }>`
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
    ${({ isDone }) => isDone && `background-color: ${Colors.background.light};`}
`
const TitleSpan = styled.span<{ isDone: boolean; shouldAnimate: boolean }>`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    color: ${({ isDone }) => (isDone ? Colors.text.light : 'initial')};

    ${({ isDone, shouldAnimate }) =>
        isDone &&
        css`
            &::after {
                content: ' ';
                position: absolute;
                left: 0;
                top: 50%;
                width: 100%;
                height: 1px;
                background-color: ${Colors.text.light};
                animation-name: ${strike};
                animation-duration: ${shouldAnimate ? '0.2s' : '0s'};
                animation-timing-function: ease-in;
                animation-iteration-count: 1;
                animation-fill-mode: forwards;
            }
        `}
`

interface SubtaskProps {
    parentTask: TTask
    subtask: TTask
}
const Subtask = ({ parentTask, subtask }: SubtaskProps) => {
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

    const [contextMenuOpen, setContextMenuOpen] = useState(false)
    const [shouldAnimate, setShouldAnimate] = useState(false)

    return (
        <SubtaskDropOffset>
            <TaskContextMenuWrapper parentTask={parentTask} task={subtask} onOpenChange={setContextMenuOpen}>
                <SubtaskContainer
                    onClick={() => navigateToTask(parentTask.id, subtask.id)}
                    ref={drag}
                    {...visibilityToggle}
                    forceHoverStyle={contextMenuOpen}
                    isDone={subtask.is_done}
                >
                    <Domino isVisible={isVisible} />
                    <MarkTaskDoneButton
                        isDone={subtask.is_done}
                        taskId={parentTask.id}
                        subtaskId={subtask.id}
                        isSelected={false}
                        onMarkComplete={() => setShouldAnimate(true)}
                    />
                    <TitleSpan isDone={subtask.is_done} shouldAnimate={shouldAnimate}>
                        {subtask.title}
                    </TitleSpan>
                    <RightContainer>
                        <DueDate date={dueDate} isDoneOrDeleted={subtask.is_done || subtask.is_deleted} />
                        {subtask.priority_normalized !== 0 && (
                            <Icon
                                icon={TASK_PRIORITIES[subtask.priority_normalized].icon}
                                color={TASK_PRIORITIES[subtask.priority_normalized].color}
                            />
                        )}
                    </RightContainer>
                </SubtaskContainer>
            </TaskContextMenuWrapper>
        </SubtaskDropOffset>
    )
}

export default Subtask
