import { useDrag } from 'react-dnd'
import styled from 'styled-components'
import { Spacing, Typography } from '../../styles'
import { DropType, TTask } from '../../utils/types'
import SelectableContainer, { OrangeEdge } from '../atoms/SelectableContainer'
import TaskTemplate from '../atoms/TaskTemplate'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'

const Container = styled(TaskTemplate)`
    height: fit-content;
`
const SlackSelectableContainer = styled(SelectableContainer)`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._16} ${Spacing._24};
    margin-bottom: ${Spacing._4};
    ${Typography.bodySmall};
`
const Title = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`
const ExternalLinkContainer = styled.div`
    margin-left: auto;
`

interface SlackTaskProps {
    task: TTask
    isSelected: boolean
    onClick: (id: string) => void
}
const SlackTask = ({ task, isSelected, onClick }: SlackTaskProps) => {
    const [, drag] = useDrag(
        () => ({
            type: DropType.NON_REORDERABLE_TASK,
            item: { id: task.id, task },
        }),
        [task]
    )
    return (
        <Container key={task.id}>
            <SlackSelectableContainer ref={drag} isSelected={isSelected} onClick={() => onClick(task.id)}>
                {isSelected && <OrangeEdge />}
                <MarkTaskDoneButton
                    isDone={task.is_done}
                    taskId={task.id}
                    isSelected={true}
                    isDisabled={!!task.optimisticId}
                />
                <Title>{task.title}</Title>
                <ExternalLinkContainer>
                    <ExternalLinkButton link={task.deeplink} />
                </ExternalLinkContainer>
            </SlackSelectableContainer>
        </Container>
    )
}

export default SlackTask
