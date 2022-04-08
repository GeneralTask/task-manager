import React, { CSSProperties, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { setExpandedCalendar } from '../../redux/tasksPageSlice'
import { useReorderTask } from '../../services/api-query-hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { margin } from '../../styles/spacing'
import { weight } from '../../styles/typography'
import { ItemTypes, TTaskSection } from '../../utils/types'
import { Icon } from '../atoms/Icon'


const LinkContainer = styled.div<{ isSelected: boolean, isOver: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;

    border-radius: ${Border.radius.small};
    border-width: 2px;
    border-style: solid;
    border-color: ${(props) => props.isOver ? Colors.gray._300 : 'transparent'};
    ${(props) => (props.isSelected ? `background-color: ${Colors.gray._50};` : '')};
`
const SectionTitle = styled.span<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600 : weight._500)};
    font-size: ${Typography.xSmall.fontSize};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: ${margin._8}px;
    flex: 1;
`
const SectionTitleItemCount = styled.span<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600 : weight._500)};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    margin-right: 9px;
`
const linkStyle: CSSProperties = {
    textDecorationLine: 'none',
    width: '100%',
}

interface NavigationLinkProps {
    isCurrentPage: boolean
    link: string
    title: string
    icon?: string
    taskSection?: TTaskSection
    droppable?: boolean
}
const NavigationLink = ({ isCurrentPage, link, title, icon, taskSection, droppable }: NavigationLinkProps) => {
    const { mutate: reorderTask } = useReorderTask()
    const dispatch = useAppDispatch()

    const onDrop = useCallback(
        (item: { id: string; taskIndex: number; sectionId: string }) => {
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
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!(taskSection && droppable && monitor.isOver())
            },
            drop: onDrop,
            canDrop: () => !!(taskSection && droppable),
        }),
        [taskSection, onDrop]
    )

    const onNavigate = () => {
        dispatch(setExpandedCalendar(false))
    }

    return (
        <Link style={linkStyle} to={link} onClick={onNavigate}>
            <LinkContainer
                ref={drop}
                isSelected={isCurrentPage}
                isOver={isOver}
            >
                <Icon size="small" source={icon} />
                <SectionTitle isSelected={isCurrentPage}>{title}</SectionTitle>
                <SectionTitleItemCount isSelected={isCurrentPage}>{taskSection?.tasks.length}</SectionTitleItemCount>
            </LinkContainer>
        </Link>
    )
}

export default NavigationLink
