import { useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { TASK_FOLDER_DEFAULT_ID } from '../../constants'
import { useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { DropItem, DropType, TTaskFolder } from '../../utils/types'
import { countWithOverflow } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from '../calendar/CalendarContext'

const LinkContainer = styled.div<{ isSelected: boolean; isOver: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._8};
    width: 100%;
    border-radius: ${Border.radius.small};
    background-color: ${(props) =>
        props.isOver ? Colors.background.dark : props.isSelected ? Colors.background.white : 'inherit'};
    color: ${Colors.text.black};
    box-sizing: border-box;
    gap: ${Spacing._12};
    transform: translate(0, 0); // to hide corners when dragging
    :hover {
        background-color: ${Colors.background.dark};
    }
`
const FolderTitle = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.bodySmall};
`
const FolderTitleItemCount = styled.span`
    margin-left: auto;
    user-select: none;
    ${Typography.bodySmall};
`
export const NavigationLinkTemplate = styled.div`
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
`

interface NavigationLinkProps {
    isCurrentPage: boolean
    link: string
    title: string
    icon?: IconProp | string
    taskFolder?: TTaskFolder
    count?: number
    draggable?: boolean
    droppable?: boolean
    testId?: string
}
const NavigationLink = ({
    isCurrentPage,
    link,
    title,
    icon,
    taskFolder,
    count,
    draggable = false,
    droppable,
    testId,
}: NavigationLinkProps) => {
    const { mutate: reorderTask } = useReorderTask()
    const { setCalendarType } = useCalendarContext()
    const navigate = useNavigate()

    const onDrop = useCallback(
        (item: DropItem) => {
            if (taskFolder && droppable) {
                reorderTask({
                    taskId: item.id,
                    orderingId: 1,
                    dropFolderId: taskFolder.id,
                    dragFolderId: item.folderId,
                })
            }
        },
        [taskFolder?.id]
    )

    const [, drag] = useDrag(
        () => ({
            type: DropType.FOLDER,
            item: { id: taskFolder?.id },
            canDrag: draggable,
            collect: (monitor) => monitor.isDragging(),
        }),
        [taskFolder, draggable]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: DropType.TASK,
            collect: (monitor) => Boolean(taskFolder && droppable && monitor.isOver()),
            drop: onDrop,
            canDrop: () => !!(taskFolder && droppable),
        }),
        [taskFolder, onDrop]
    )

    const onClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        if (taskFolder?.id === TASK_FOLDER_DEFAULT_ID) e.preventDefault()
        setCalendarType('day')
        navigate(link)
    }

    return (
        <NavigationLinkTemplate ref={drop} onClick={onClickHandler} data-testid={testId}>
            <LinkContainer ref={drag} isSelected={isCurrentPage} isOver={isOver}>
                {icon && <Icon size="xSmall" icon={icon} color={Colors.icon.black} />}
                <FolderTitle>{title}</FolderTitle>
                <FolderTitleItemCount>{count && countWithOverflow(count)}</FolderTitleItemCount>
            </LinkContainer>
        </NavigationLinkTemplate>
    )
}

export default NavigationLink
