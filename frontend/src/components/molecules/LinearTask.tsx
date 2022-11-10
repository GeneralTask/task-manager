import { useState } from 'react'
import { useDrag } from 'react-dnd'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import Log from '../../services/api/log'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { Spacing, Typography } from '../../styles'
import { linearStatus } from '../../styles/images'
import { DropType, TTask } from '../../utils/types'
import CommentCount from '../atoms/CommentCount'
import Domino from '../atoms/Domino'
import SelectableContainer, { OrangeEdge } from '../atoms/SelectableContainer'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTButtonHack } from './Task'

const DominoIconContainer = styled.div`
    display: flex;
    align-items: center;
`
const LinearSelectableContainer = styled(SelectableContainer)`
    display: flex;
    padding: ${Spacing._16} ${Spacing._16};
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
const DominoContainer = styled.div<{ isHovered: boolean }>`
    opacity: ${({ isHovered }) => (isHovered ? 1 : 0)};
`

interface LinearTaskProps {
    task: TTask
}
const LinearTask = ({ task }: LinearTaskProps) => {
    const navigate = useNavigate()
    const { linearIssueId } = useParams()
    const [isHovered, setIsHovered] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const [, drag] = useDrag(
        () => ({
            type: DropType.NON_REORDERABLE_TASK,
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
        Log(`linear_select_/linear/${id}`)
    }

    return (
        <LinearSelectableContainer
            key={task.id}
            onClick={() => onClick(task.id)}
            isSelected={linearIssueId === task.id}
            ref={drag}
            onMouseLeave={() => setIsHovered(false)}
            onMouseEnter={() => setIsHovered(true)}
        >
            {linearIssueId === task.id && <OrangeEdge />}
            <LeftContainer>
                <DominoIconContainer>
                    <DominoContainer isHovered={isHovered}>
                        <Domino />
                    </DominoContainer>
                    {task.external_status && task.all_statuses && (
                        <GTDropdownMenu
                            items={task.all_statuses.map((status) => ({
                                label: status.state,
                                onClick: () => modifyTask({ id: task.id, status: status }),
                                icon: linearStatus[status.type],
                                selected: status.state === task.external_status?.state,
                            }))}
                            trigger={
                                <GTButtonHack
                                    value={status}
                                    icon={linearStatus[task.external_status.type]}
                                    size="small"
                                    styleType="simple"
                                    asDiv
                                />
                            }
                        />
                    )}
                </DominoIconContainer>
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
