import { useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { TASK_SECTION_DEFAULT_ID } from '../../constants'
import Log from '../../services/api/log'
import { useMarkTaskDoneOrDeleted, useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TIconColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { DropItem, DropType, TTaskSection } from '../../utils/types'
import { countWithOverflow } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from '../calendar/CalendarContext'
import Tip from '../radix/Tip'

export const CollapsedIconContainer = styled.div<{ isSelected?: boolean }>`
    padding: ${Spacing._8} ${Spacing._24};
    cursor: pointer;
    margin-bottom: ${Spacing._8};
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
    width: 100%;
    border-radius: ${Border.radius.small};
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
const SectionTitle = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.bodySmall};
`
const SectionTitleItemCount = styled.span`
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
    taskSection?: TTaskSection
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
    taskSection,
    count,
    needsRelinking = false,
    draggable = false,
    droppable,
    isCollapsed = false,
}: NavigationLinkProps) => {
    const { mutate: reorderTask } = useReorderTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const { setCalendarType } = useCalendarContext()
    const navigate = useNavigate()

    const onDrop = useCallback(
        (item: DropItem) => {
            if (!taskSection || !droppable || !item.task) return
            if (taskSection.id === item.sectionId) return
            if (taskSection?.is_done || taskSection?.is_trash) {
                markTaskDoneOrDeleted(
                    {
                        id: item.id,
                        isDone: taskSection?.is_done,
                        isDeleted: taskSection?.is_trash,
                        sectionId: taskSection.id,
                    },
                    item.task.optimisticId
                )
            } else {
                reorderTask(
                    {
                        id: item.id,
                        orderingId: 1,
                        dropSectionId: taskSection.id,
                        dragSectionId: item.sectionId,
                    },
                    item.task.optimisticId
                )
            }
        },
        [taskSection]
    )

    const [, drag] = useDrag(
        () => ({
            type: DropType.FOLDER,
            item: { id: taskSection?.id },
            canDrag: draggable,
            collect: (monitor) => monitor.isDragging(),
        }),
        [taskSection, draggable]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => Boolean(taskSection && droppable && monitor.isOver()),
            drop: onDrop,
            canDrop: () => !!(taskSection && droppable),
        }),
        [taskSection, onDrop]
    )

    const onClickHandler = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
        if (taskSection?.id === TASK_SECTION_DEFAULT_ID) e.preventDefault()
        setCalendarType('day')
        Log(`navigate__${link}`)
        navigate(link)
    }

    if (isCollapsed && icon) {
        const countOverflow = countWithOverflow(count ?? 0)
        const content = taskSection ? `${title} (${countOverflow})` : title
        return (
            <Tip content={content} side="right">
                <CollapsedIconContainer onClick={onClickHandler} isSelected={isCurrentPage}>
                    <Icon icon={icon} size="default" />
                </CollapsedIconContainer>
            </Tip>
        )
    }
    return (
        <NavigationLinkTemplate ref={drop} onClick={onClickHandler}>
            <LinkContainer ref={drag} isSelected={isCurrentPage} isOver={isOver}>
                {icon && <Icon icon={icon} color={iconColor} />}
                <SectionTitle>{title}</SectionTitle>
                {needsRelinking && (
                    <Tip content="Account needs to be re-linked in settings">
                        <Icon icon={icons.warning} color="red" />
                    </Tip>
                )}
                <SectionTitleItemCount>{count && countWithOverflow(count)}</SectionTitleItemCount>
            </LinkContainer>
        </NavigationLinkTemplate>
    )
}

export default NavigationLink
