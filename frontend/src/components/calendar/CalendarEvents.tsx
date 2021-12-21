import React from 'react'
import { TTaskGroup, TTaskGroupType } from '../../helpers/types'
import { useAppSelector } from '../../redux/hooks'
import styled from 'styled-components'
import {
    EVENT_CONTAINER_COLOR,
    TABLE_WIDTH_PERCENTAGE,
    CELL_HEIGHT,
    CALENDAR_TD_COLOR,
    CALENDAR_TIME_COLOR,
    CELL_TIME_WIDTH,
    CELL_BORDER_WIDTH,
    CELL_LEFT_MARGIN,
    EVENT_TITLE_TEXT_COLOR,
    EVENT_TIME_TEXT_COLOR
} from '../../helpers/styles'

const EventsContainer = styled.div`
    width: 100%;
    margin-top: 24px;
    flex: 1;
    display: flex;
    overflow: scroll;
    background-color: ${EVENT_CONTAINER_COLOR};
    justify-content: center;
    position: relative;
`
const CalendarTableStyle = styled.table`
    border-collapse: collapse;
    width: ${TABLE_WIDTH_PERCENTAGE}%;
`
const CalendarRow = styled.tr`
    height: ${CELL_HEIGHT}px;
`
const CalendarTD = styled.td`
    border-top: 1px solid ${CALENDAR_TD_COLOR};
    height: 100%;
`
const CalendarCell = styled.div`
    width: 100%;
    height: 100%;
    font-size: 13px;
    font-weight: 600;
    color: ${CALENDAR_TIME_COLOR};
`
const CellTime = styled.div`
    width: ${CELL_TIME_WIDTH}px;
    height: 40px;
    margin-top: 12px;
    text-align: right;
`
interface EventBodyStyleProps {
    eventBodyHeight: number
    topOffset: number
}
const EventBodyStyle = styled.div<EventBodyStyleProps>`
    border-left: ${CELL_BORDER_WIDTH}px solid black;
    width: calc(${TABLE_WIDTH_PERCENTAGE}% - ${CELL_TIME_WIDTH}px - ${CELL_BORDER_WIDTH}px - ${CELL_LEFT_MARGIN}px);
    height: ${props => props.eventBodyHeight}px;
    top: ${props => props.topOffset}px;
    position: absolute;
    right: calc(${(100 - TABLE_WIDTH_PERCENTAGE) / 2}%);
`
const EventFill = styled.div`
    width: 100%;
    height: 100%;
    background-color: black;
    opacity: 15%;
    border-radius: 0 10px 10px 0;
`
const EventDescription = styled.div`
    position: absolute;
    opacity: 100%;
    padding-left: 8px;
    padding-top: 8px;
    z-index: 1;
`
const EventTitle = styled.div`
    font-style: normal;
    font-size: 14px;
    font-weight: 600;
    color: ${EVENT_TITLE_TEXT_COLOR};
`
const EventTime = styled.div`
    font-style: normal;
    font-size: 13px;
    font-weight: 600;
    color: ${EVENT_TIME_TEXT_COLOR};
    margin-top: 2px;
`

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
            <EventFill>
            </EventFill>
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
            <CalendarTable></CalendarTable>
        </EventsContainer>
    )
}
