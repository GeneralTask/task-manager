import styled from 'styled-components'
import { TABLE_WIDTH_PERCENTAGE, CELL_HEIGHT, CALENDAR_TD_COLOR, CALENDAR_TIME_COLOR, CELL_TIME_WIDTH, CELL_BORDER_WIDTH, CELL_LEFT_MARGIN, EVENT_TITLE_TEXT_COLOR, EVENT_TIME_TEXT_COLOR } from '../../helpers/styles'

export const EventsContainer = styled.div`
    width: 100%;
    margin-top: 24px;
    flex: 1;
    display: flex;
    overflow: scroll;
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
export const EventInfoContainer = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    position: absolute;
    z-index: 1;
`
export const EventInfo = styled.div<{ isLongEvent: boolean }>`
    overflow: hidden;
    white-space: nowrap;    
    margin: 0 12px;
    align-items: center;
    ${props => props.isLongEvent
        ? 'height: 100%; margin-top: 18px;'
        : 'display: flex;'
    }
`
export const EventTitle = styled.div<{ isLongEvent: boolean }>`
    font-style: normal;
    font-size: 14px;
    font-weight: 600;
    color: ${EVENT_TITLE_TEXT_COLOR};
    margin-right: 8px;
    /* float: left; */
    max-height: 100%;
    ${props => props.isLongEvent && 'font-weight: 600;'}
`
export const EventTime = styled.div`
    font-style: normal;
    font-size: 13px;
    font-weight: 600;
    color: ${EVENT_TIME_TEXT_COLOR};
    float: left;
    max-height: 100%;
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
