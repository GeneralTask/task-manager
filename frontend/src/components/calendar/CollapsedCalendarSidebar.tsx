import React from 'react'
import styled from 'styled-components'
import { Spacing, Colors, Shadows } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { useCalendarContext } from './CalendarContext'
import { CaretButton } from './CalendarHeader'

const Sidebar = styled.div`
    padding: ${Spacing.padding._16} ${Spacing.padding._4} 0;
    background-color: ${Colors.background.medium};
    display: flex;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
    box-shadow: ${Shadows.light};
`

interface CalendarHeaderProps {
    onClick: () => void
}
const CollapsedCalendarSidebar = ({ onClick }: CalendarHeaderProps) => {
    useCalendarContext()
    return (
        <Sidebar onClick={onClick}>
            <CaretButton>
                <Icon icon={icons.calendar_blank} size="small" />
            </CaretButton>
        </Sidebar>
    )
}

export default CollapsedCalendarSidebar
