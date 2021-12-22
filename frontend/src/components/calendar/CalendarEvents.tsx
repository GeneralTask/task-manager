import React from 'react'
import { TTaskGroup, TTaskGroupType } from '../../helpers/types'
import { useAppSelector } from '../../redux/hooks'
import { TimeIndicator } from './TimeIndicator'
import { CELL_HEIGHT } from '../../helpers/styles'
import { CalendarRow, CalendarTD, CalendarCell, CellTime, CalendarTableStyle, EventBodyStyle, EventDescription, EventTitle, EventTime, EventFill, EventsContainer } from './CalendarEvents-styles'

function CalendarTable(): JSX.Element {
    const hourElements = Array(24).fill(0).map((_, index) => (
        <CalendarRow key={index}>
            <CalendarTD>
                <CalendarCell>
                    <CellTime>{`${(index) % 12 + 1}:00`}</CellTime>
                </CalendarCell>
            </CalendarTD>
        </CalendarRow>
    ))
    return (
        <CalendarTableStyle>
            <tbody>
                {hourElements}
            </tbody>
        </CalendarTableStyle>
    )
}

interface EventBodyProps {
    event: TTaskGroup
}
function EventBody({ event }: EventBodyProps): JSX.Element | null {
    if (event.datetime_start == null) return null

    // calculate ratio of minutes to height of all cells
    const timeDurationMinutes = event.time_duration / 60
    const eventBodyHeight = timeDurationMinutes / (24 * 60) * (CELL_HEIGHT * 24)

    const startTime = new Date(event.datetime_start)
    const endTime = new Date(startTime.toString())
    endTime.setTime(endTime.getTime() + event.time_duration / 60 * 60000)

    const startTimeHours = startTime.getHours() - 1
    const startTimeMinutes = startTime.getMinutes()
    const topOffset = ((60 * startTimeHours) + startTimeMinutes) * (CELL_HEIGHT / 60)

    const MMHH = { hour: 'numeric', minute: 'numeric', hour12: true } as const
    const startTimeString = startTime.toLocaleString('en-US', MMHH).replace(/AM|PM/, '')
    const endTimeString = endTime.toLocaleString('en-US', MMHH)

    return (
        <EventBodyStyle key={event.tasks[0].id} topOffset={topOffset} eventBodyHeight={eventBodyHeight}>
            <EventDescription>
                <EventTitle>
                    {event.tasks[0].title}
                </EventTitle>
                <EventTime>
                    {`${startTimeString} - ${endTimeString}`}
                </EventTime>
            </EventDescription>
            <EventFill />
        </EventBodyStyle>
    )
}

export default function CalendarEvents(): JSX.Element {
    const scheduledGroups = useAppSelector((state) => {
        const scheduledGroups = []
        const sections = state.tasks_page.task_sections
        for (const section of sections) {
            const groups = section.task_groups
            for (const group of groups) {
                if (group.type === TTaskGroupType.SCHEDULED_TASK) {
                    scheduledGroups.push(group)
                }
            }
        }
        return scheduledGroups
    })
    const eventBodies = scheduledGroups.map((event: TTaskGroup) => {
        if (event.datetime_start == null) return
        if (event.tasks == null || event.tasks.length === 0) return
        return <EventBody key={event.tasks[0].id} event={event} />
    })
    return (
        <EventsContainer>
            {eventBodies}
            <TimeIndicator />
            <CalendarTable />
        </EventsContainer>
    )
}
