import React from 'react'
import { useDrop } from 'react-dnd'
import styled, { css, keyframes } from 'styled-components'
import { Spacing, Colors, Shadows } from '../../styles'
import { icons } from '../../styles/images'
import { DropType } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from './CalendarContext'
import { CaretButton } from './CalendarHeader'

const flicker = keyframes`
    from {opacity: 1;}
`
const Sidebar = styled.div<{ showFlicker: boolean }>`
    padding: ${Spacing.padding._16} ${Spacing.padding._4} 0;
    background-color: ${Colors.background.medium};
    display: flex;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
    position: relative;
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        box-shadow: ${Shadows.medium};
        ${(props) =>
            props.showFlicker
                ? css`
                      animation: ${flicker} 0.4s ease-in-out infinite alternate;
                  `
                : ''}
    }
`

interface CalendarHeaderProps {
    onClick: () => void
}
const CollapsedCalendarSidebar = ({ onClick }: CalendarHeaderProps) => {
    const { isTaskDraggingOverDetailsView, setIsCollapsed } = useCalendarContext()
    const [, drop] = useDrop(
        () => ({
            accept: [DropType.TASK],
            collect: (monitor) => {
                if (monitor.getItemType() === DropType.TASK && monitor.isOver()) {
                    setIsCollapsed(false)
                }
            },
        }),
        [setIsCollapsed]
    )
    return (
        <Sidebar onClick={onClick} showFlicker={isTaskDraggingOverDetailsView} ref={drop}>
            <CaretButton>
                <Icon icon={icons.calendar_blank} size="small" />
            </CaretButton>
        </Sidebar>
    )
}

export default CollapsedCalendarSidebar
