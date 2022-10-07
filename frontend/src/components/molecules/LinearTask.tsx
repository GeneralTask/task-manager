import { useDrag } from 'react-dnd'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Spacing, Typography } from '../../styles'
import { linearStatus } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import CommentCount from '../atoms/CommentCount'
import { Icon } from '../atoms/Icon'
import SelectableContainer, { PurpleEdge } from '../atoms/SelectableContainer'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'

const LinearSelectableContainer = styled(SelectableContainer)`
    display: flex;
    padding: ${Spacing._16} ${Spacing._24};
    margin-bottom: ${Spacing._4};
    align-items: center;
    ${Typography.bodySmall};
`

const LinearTitle = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`
const LeftContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    min-width: 0;
    margin-right: ${Spacing._16};
`
const RightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._24};
    margin-left: auto;
`

interface LinearTaskProps {
    task: TTask
}
const LinearTask = ({ task }: LinearTaskProps) => {
    const navigate = useNavigate()
    const { linearIssueId } = useParams()

    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.LINEAR_TASK,
            item: { id: task.id, task },
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [task]
    )

    const onClick = (id: string) => {
        navigate(`/linear/${id}`)
    }

    return (
        <LinearSelectableContainer
            key={task.id}
            onClick={() => onClick(task.id)}
            isSelected={linearIssueId === task.id}
            ref={(node) => drag(dragPreview(node))}
        >
            {linearIssueId === task.id && <PurpleEdge />}
            <LeftContainer>
                {task.external_status && <Icon icon={linearStatus[task.external_status?.type]} />}
                <LinearTitle>{task.title}</LinearTitle>
            </LeftContainer>
            <RightContainer>
                {task.comments && task.comments.length > 0 && <CommentCount count={task.comments.length} />}
                <ExternalLinkButton link={task.deeplink} />
            </RightContainer>
        </LinearSelectableContainer>
    )
}

export default LinearTask
