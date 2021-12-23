import styled from 'styled-components'
import { EVENT_CONTAINER_COLOR, TABLE_WIDTH_PERCENTAGE, CELL_HEIGHT, CALENDAR_TD_COLOR, CALENDAR_TIME_COLOR, CELL_TIME_WIDTH, CELL_BORDER_WIDTH, CELL_LEFT_MARGIN, EVENT_TITLE_TEXT_COLOR, EVENT_TIME_TEXT_COLOR } from '../../helpers/styles'

export const EventsContainer = styled.div`
    width: 100%;
    margin-top: 24px;
    flex: 1;
    display: flex;
    overflow: scroll;
    background-color: ${EVENT_CONTAINER_COLOR};
    justify-content: center;
    position: relative;
`
export const CalendarTableStyle = styled.table`
    border-collapse: collapse;
    width: ${TABLE_WIDTH_PERCENTAGE}%;
`
export const CalendarRow = styled.tr`
    display: block;
    height: ${CELL_HEIGHT}px;
`
export const CalendarTD = styled.td`
    display: block;
    border-top: 1px solid ${CALENDAR_TD_COLOR};
    height: 100%;
`
export const CalendarCell = styled.div`
    width: 100%;
    height: 100%;
    font-size: 13px;
    font-weight: 600;
    color: ${CALENDAR_TIME_COLOR};
`
export const CellTime = styled.div`
    width: ${CELL_TIME_WIDTH}px;
    height: 40px;
    margin-top: 12px;
    text-align: right;
`
interface EventBodyStyleProps {
    eventBodyHeight: number
    topOffset: number
}
export const EventBodyStyle = styled.div<EventBodyStyleProps>`
    width: calc(${TABLE_WIDTH_PERCENTAGE}% - ${CELL_TIME_WIDTH}px - ${CELL_BORDER_WIDTH}px - ${CELL_LEFT_MARGIN}px);
    height: ${props => props.eventBodyHeight}px;
    top: ${props => props.topOffset}px;
    position: absolute;
    right: calc(${(100 - TABLE_WIDTH_PERCENTAGE) / 2}%);
`
export const EventFill = styled.div`
    width: 100%;
    height: 100%;
    background-color: black;
    opacity: 15%;
    border-radius: 8px;
`
export const EventFillContinues = styled(EventFill)`
    border-radius: 8px 8px 0 0;
`
export const EventDescription = styled.div`
    position: absolute;
    opacity: 100%;
    padding: 12px;
    z-index: 1;
`
export const EventTitle = styled.div`
    font-style: normal;
    font-size: 14px;
    font-weight: 600;
    color: ${EVENT_TITLE_TEXT_COLOR};
`
export const EventTime = styled.div`
    font-style: normal;
    font-size: 13px;
    font-weight: 600;
    color: ${EVENT_TIME_TEXT_COLOR};
    margin-top: 2px;
`
