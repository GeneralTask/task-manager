import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import styled from 'styled-components'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { Spacing } from '../../styles'
import { DropType, TTaskV4 } from '../../utils/types'
import Domino from '../atoms/Domino'
import SelectableContainer, { EdgeHighlight } from '../atoms/SelectableContainer'
import TaskTemplate from '../atoms/TaskTemplate'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import PriorityDropdown from '../radix/PriorityDropdown'

const Container = styled(TaskTemplate)`
    height: fit-content;
`
const Title = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`
const RightContainer = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
`

interface SlackTaskProps {
    task: TTaskV4
    isSelected: boolean
    onClick: (id: string) => void
}
const SlackTask = ({ task, isSelected, onClick }: SlackTaskProps) => {
    const [isHovered, setIsHovered] = useState(false)
    const { mutate: modifyTask } = useModifyTask()
    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.NON_REORDERABLE_TASK,
            item: { id: task.id, task },
        }),
        [task]
    )

    // hide default drag preview
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    return (
        <Container key={task.id}>
            <SelectableContainer
                ref={drag}
                isSelected={isSelected}
                onClick={() => onClick(task.id)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseEnter={() => setIsHovered(true)}
            >
                {isSelected && <EdgeHighlight color="orange" />}
                <Domino isVisible={isHovered} />
                <MarkTaskDoneButton
                    isDone={task.is_done}
                    taskId={task.id}
                    isSelected={true}
                    isDisabled={!!task.optimisticId}
                />
                <Title>{task.title}</Title>
                <RightContainer>
                    {task.priority_normalized !== 0 && Number.isInteger(task.priority_normalized) && (
                        <PriorityDropdown
                            value={task.priority_normalized}
                            onChange={(priority) =>
                                modifyTask({ id: task.id, priorityNormalized: priority }, task.optimisticId)
                            }
                            condensedTrigger
                        />
                    )}
                    <ExternalLinkButton link={task.deeplink} />
                </RightContainer>
            </SelectableContainer>
        </Container>
    )
}

export default SlackTask
