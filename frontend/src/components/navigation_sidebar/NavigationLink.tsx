import React, { useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { TASK_SECTION_DEFAULT_ID } from '../../constants'
import { useAppDispatch } from '../../redux/hooks'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import { useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { DropItem, DropType, TTaskSection } from '../../utils/types'
import { countWithOverflow } from '../../utils/utils'
import { Icon } from '../atoms/Icon'

const LinkContainer = styled.div<{ isSelected: boolean; isOver: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4} ${Spacing.padding._12};
    width: 100%;
    border-radius: ${Border.radius.small};
    background-color: ${(props) => (props.isSelected || props.isOver ? Colors.background.dark : 'transparent')};
    box-sizing: border-box;
    gap: ${Spacing.margin._8};
`
const SectionTitle = styled.span`
    color: ${Colors.text.light};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.bodySmall};
`
const SectionTitleItemCount = styled.span`
    color: ${Colors.text.light};
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
    icon?: string
    taskSection?: TTaskSection
    count?: number
    droppable?: boolean
    testId?: string
}
const NavigationLink = ({
    isCurrentPage,
    link,
    title,
    icon,
    taskSection,
    count,
    droppable,
    testId,
}: NavigationLinkProps) => {
    const { mutate: reorderTask } = useReorderTask()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const onDrop = useCallback(
        (item: DropItem) => {
            if (taskSection && droppable) {
                reorderTask({
                    taskId: item.id,
                    orderingId: 1,
                    dropSectionId: taskSection.id,
                    dragSectionId: item.sectionId,
                })
            }
        },
        [taskSection?.id]
    )

    const [isOver, drop] = useDrop(
        () => ({
            accept: DropType.TASK,
            collect: (monitor) => {
                return !!(taskSection && droppable && monitor.isOver())
            },
            drop: onDrop,
            canDrop: () => !!(taskSection && droppable),
        }),
        [taskSection, onDrop]
    )

    const onClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        if (taskSection?.id === TASK_SECTION_DEFAULT_ID) e.preventDefault()
        dispatch(setExpandedCalendar(false))
        navigate(link)
    }

    return (
        <NavigationLinkTemplate onClick={onClickHandler} data-testid={testId}>
            <LinkContainer ref={drop} isSelected={isCurrentPage} isOver={isOver}>
                <Icon size="xSmall" source={icon} />
                <SectionTitle>{title}</SectionTitle>
                <SectionTitleItemCount>{count && countWithOverflow(count)}</SectionTitleItemCount>
            </LinkContainer>
        </NavigationLinkTemplate>
    )
}

export default NavigationLink
