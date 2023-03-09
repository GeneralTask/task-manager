import { useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { TASK_FOLDER_DEFAULT_ID, TRASH_FOLDER_ID } from '../../constants'
import { useToast } from '../../hooks'
import Log from '../../services/api/log'
import { useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TIconColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { DropItem, DropType, TTaskFolder } from '../../utils/types'
import { countWithOverflow } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from '../calendar/CalendarContext'
import Tip from '../radix/Tip'

export const CollapsedIconContainer = styled.div<{ isSelected?: boolean }>`
    padding: ${Spacing._8} ${Spacing._24};
    cursor: pointer;
    ${({ isSelected }) =>
        isSelected &&
        `
        background-color: ${Colors.background.medium};
        mix-blend-mode: multiply;
    `}
    :hover {
        background-color: ${Colors.background.white};
        mix-blend-mode: normal;
    }
`
const LinkContainer = styled.div<{ isSelected: boolean; isOver: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing._8};
    margin: 0 ${Spacing._8};
    flex: 1;
    min-width: 0;
    border-radius: ${Border.radius.medium};
    background-color: ${({ isOver, isSelected }) =>
        isOver ? Colors.background.white : isSelected ? Colors.background.medium : 'inherit'};
    mix-blend-mode: ${({ isOver, isSelected }) => (isSelected && !isOver ? 'multiply' : 'inherit')};
    color: ${Colors.text.black};
    box-sizing: border-box;
    gap: ${Spacing._12};
    transform: translate(0, 0); // to hide corners when dragging
    :hover {
        background-color: ${Colors.background.white};
        mix-blend-mode: inherit;
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
    iconColor?: TIconColor
    taskFolder?: TTaskFolder
    count?: number
    needsRelinking?: boolean
    draggable?: boolean
    droppable?: boolean
    isCollapsed?: boolean
}
const NavigationLink = ({
    isCurrentPage,
    link,
    title,
    icon,
    iconColor,
    taskFolder,
    count,
    needsRelinking = false,
    draggable = false,
    droppable,
    isCollapsed = false,
}: NavigationLinkProps) => {
    const { mutate: reorderTask } = useReorderTask()
    const { showTaskToCalSidebar, setShowTaskToCalSidebar, calendarType } = useCalendarContext()
    const navigate = useNavigate()
    const toast = useToast()

    const onDrop = useCallback(
        (item: DropItem) => {
            if (!taskFolder || !droppable || !item.task) return
            if (taskFolder.id === item.sectionId) return
            if (item.task.source.name === 'Jira' && taskFolder.id === TRASH_FOLDER_ID) {
                toast.show({
                    message: 'Cannot delete Jira tasks',
                })
                return
            }
            reorderTask(
                {
                    id: item.id,
                    orderingId: 1,
                    dropSectionId: taskFolder.id,
                    dragSectionId: item.sectionId,
                },
                item.task.optimisticId
            )
        },
        [taskFolder]
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
            accept: [DropType.TASK],
            collect: (monitor) => Boolean(taskFolder && droppable && monitor.isOver()),
            drop: onDrop,
            canDrop: () => !!(taskFolder && droppable),
        }),
        [taskFolder, onDrop]
    )

    const onClickHandler = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
        if (taskFolder?.id === TASK_FOLDER_DEFAULT_ID) e.preventDefault()
        if (!showTaskToCalSidebar && calendarType === 'week') {
            setShowTaskToCalSidebar(true)
        }
        if (isCurrentPage) return
        Log(`navigate__${link}`)
        navigate(link)
    }

    if (isCollapsed && icon) {
        return (
            <CollapsedIconContainer onClick={onClickHandler} isSelected={isCurrentPage}>
                <Icon icon={icon} size="default" color={iconColor} />
            </CollapsedIconContainer>
        )
    }
    return (
        <NavigationLinkTemplate ref={drop} onClick={onClickHandler}>
            <LinkContainer ref={drag} isSelected={isCurrentPage} isOver={isOver}>
                {icon && <Icon icon={icon} color={iconColor} />}
                <FolderTitle>{title}</FolderTitle>
                {needsRelinking && (
                    <Tip content="Account needs to be re-linked in settings">
                        <Icon icon={icons.warning} color="red" />
                    </Tip>
                )}
                <FolderTitleItemCount>{count && countWithOverflow(count)}</FolderTitleItemCount>
            </LinkContainer>
        </NavigationLinkTemplate>
    )
}

export default NavigationLink
