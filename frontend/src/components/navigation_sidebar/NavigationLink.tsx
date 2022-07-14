import React, { useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { TASK_SECTION_DEFAULT_ID } from '../../constants'
import { useAppDispatch } from '../../redux/hooks'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import { useReorderTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { margin } from '../../styles/spacing'
import { weight } from '../../styles/typography'
import { DropItem, DropType, TTaskSection } from '../../utils/types'
import { countWithOverflow } from '../../utils/utils'
import { Icon } from '../atoms/Icon'

const LINK_TEMPLATE_HEIGHT = 32

const LinkContainer = styled.div<{ isSelected: boolean; isOver: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4} ${Spacing.padding._8};
    width: 100%;
    border-radius: ${Border.radius.small};
    border-width: 2px;
    border-style: solid;
    border-color: ${(props) => (props.isOver ? Colors.gray._300 : 'transparent')};
    ${(props) => props.isSelected && `background-color: ${Colors.gray._50};`};
    box-sizing: border-box;
`
const SectionTitle = styled.span<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600 : weight._500)};
    font-size: ${Typography.xSmall.fontSize};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: ${margin._8};
    flex: 1;
    user-select: none;
`
const SectionTitleItemCount = styled.span<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600 : weight._500)};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    margin-right: ${margin._8};
    margin-left: auto;
    user-select: none;
`
export const NavigationLinkTemplate = styled.div`
    height: ${LINK_TEMPLATE_HEIGHT}px;
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
                <Icon size="small" source={icon} />
                <SectionTitle isSelected={isCurrentPage}>{title}</SectionTitle>
                <SectionTitleItemCount isSelected={isCurrentPage}>
                    {count && countWithOverflow(count)}
                </SectionTitleItemCount>
            </LinkContainer>
        </NavigationLinkTemplate>
    )
}

export default NavigationLink
