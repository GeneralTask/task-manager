import { useEffect, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import Log from '../../services/api/log'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { Spacing, Typography } from '../../styles'
import { externalStatusIcons } from '../../styles/images'
import { DropType, TTaskV4 } from '../../utils/types'
import CommentCount from '../atoms/CommentCount'
import Domino from '../atoms/Domino'
import SelectableContainer, { EdgeHighlight } from '../atoms/SelectableContainer'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import PriorityDropdown from '../radix/PriorityDropdown'
import LinearCycle from './LinearCycle'
import { GTButtonHack } from './Task'

const DominoIconContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
`
const LinearSelectableContainer = styled(SelectableContainer)`
    display: flex;
    padding: ${Spacing._8} ${Spacing._8} ${Spacing._8} ${Spacing._16};
    margin-bottom: ${Spacing._4};
    align-items: center;
    ${Typography.deprecated_bodySmall};
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
    gap: ${Spacing._8};
    margin-left: auto;
`

interface LinearTaskProps {
    task: TTaskV4
}
const LinearTask = ({ task }: LinearTaskProps) => {
    const { isPreviewMode } = usePreviewMode()
    const navigate = useNavigate()
    const { linearIssueId } = useParams()
    const { calendarType, setCalendarType, setDate, dayViewDate } = useCalendarContext()
    const [isHovered, setIsHovered] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const [, drag, dragPreview] = useDrag(
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

    // hide default drag preview
    useEffect(() => {
        dragPreview(getEmptyImage())
    }, [])

    const onClick = (id: string) => {
        if (calendarType === 'week' && linearIssueId === id) {
            setCalendarType('day')
            setDate(dayViewDate)
        }
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
            {linearIssueId === task.id && <EdgeHighlight color="orange" />}
            <LeftContainer>
                <DominoIconContainer>
                    <Domino isVisible={isHovered} />
                    {task.external_status && task.all_statuses && (
                        <GTDropdownMenu
                            items={task.all_statuses.map((status) => ({
                                label: status.state,
                                onClick: () => modifyTask({ id: task.id, status: status }, task.optimisticId),
                                icon: externalStatusIcons[status.type],
                                selected: status.state === task.external_status?.state,
                            }))}
                            trigger={
                                <GTButtonHack
                                    icon={externalStatusIcons[task.external_status.type]}
                                    styleType="control"
                                />
                            }
                        />
                    )}
                </DominoIconContainer>
                <LinearTitle>{task.title}</LinearTitle>
            </LeftContainer>
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
                {task.comments && task.comments.length > 0 && <CommentCount count={task.comments.length} />}
                {isPreviewMode && task.linear_cycle && <LinearCycle cycle={task.linear_cycle} isCondensed />}
                <ExternalLinkButton link={task.deeplink} />
            </RightContainer>
        </LinearSelectableContainer>
    )
}

export default LinearTask
