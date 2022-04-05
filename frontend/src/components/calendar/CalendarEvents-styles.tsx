import { Colors, Shadows } from '../../styles'

import styled from 'styled-components'
export const CELL_HEIGHT = 64
export const TABLE_WIDTH_PERCENTAGE = 100
export const CELL_TIME_WIDTH = 43
export const CELL_BORDER_WIDTH = 3
export const CELL_LEFT_MARGIN = 10
export const EVENT_CONTAINER_COLOR = Colors.gray._50
export const EVENT_TITLE_TEXT_COLOR = Colors.gray._700
export const EVENT_TIME_TEXT_COLOR = Colors.gray._500
export const CALENDAR_TD_COLOR = Colors.gray._200
export const CALENDAR_TIME_COLOR = Colors.gray._400
export const CALENDAR_INDICATOR_COLOR = Colors.red._1
export const CALENDAR_DEFAULT_SCROLL_HOUR = 8
export const EVENT_BOTTOM_PADDING = 2.5

const WIDTH_CSS_CALCULATION = `(${TABLE_WIDTH_PERCENTAGE}% - ${CELL_TIME_WIDTH}px - ${CELL_BORDER_WIDTH}px - ${CELL_LEFT_MARGIN}px) * 1/var(--squish-factor)`

export const DayContainer = styled.div`
    width: 100%;
    height: 100%;
    margin-top: 24px;
    flex: 1;
    display: flex;
    overflow: auto;
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
    border-left: 1px solid ${CALENDAR_TD_COLOR};
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
    margin-top: 6px;
    text-align: right;
`
interface EventBodyStyleProps {
    eventBodyHeight: number
    topOffset: number
    squishFactor: number
    leftOffset: number
    eventHasEnded: boolean
}
export const EventBodyStyle = styled.div<EventBodyStyleProps>`
    --squish-factor: ${({ squishFactor }) => squishFactor};
    --left-offset: ${({ leftOffset }) => leftOffset};
    width: calc(${WIDTH_CSS_CALCULATION});
    height: calc(${(props) => props.eventBodyHeight}px - ${EVENT_BOTTOM_PADDING}px);
    top: ${(props) => props.topOffset}px;
    position: absolute;
    left: calc(${100 - TABLE_WIDTH_PERCENTAGE}% + ${CELL_TIME_WIDTH}px + ${CELL_LEFT_MARGIN}px + (${WIDTH_CSS_CALCULATION}) * var(--left-offset));
    opacity: ${({ eventHasEnded }) => (eventHasEnded ? 0.5 : 1)};
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
    ${(props) => (props.isLongEvent ? 'height: 100%; margin-top: 18px;' : 'display: flex;')}
`
export const EventTitle = styled.div<{ isLongEvent: boolean }>`
    font-style: normal;
    font-size: 14px;
    font-weight: 600;
    color: ${EVENT_TITLE_TEXT_COLOR};
    margin-right: 8px;
    max-height: 100%;
    ${(props) => props.isLongEvent && 'font-weight: 600;'}
`
export const EventTime = styled.div`
    font-style: normal;
    font-size: 13px;
    font-weight: 600;
    color: ${EVENT_TIME_TEXT_COLOR};
    float: left;
    max-height: 100%;
`
export const EventFill = styled.div<{ squareStart: boolean, squareEnd: boolean }>`
    width: 100%;
    height: 100%;
    background: ${Colors.white};
    border: 1px solid ${EVENT_CONTAINER_COLOR};
    box-sizing: border-box;
    box-shadow: ${Shadows.small};
    border-top-left-radius: ${(props) => (props.squareStart ? '0' : '10px')};
    border-top-right-radius: ${(props) => (props.squareStart ? '0' : '10px')};
    border-bottom-left-radius: ${(props) => (props.squareEnd ? '0' : '10px')};
    border-bottom-right-radius: ${(props) => (props.squareEnd ? '0' : '10px')};
`
export const EventFillContinues = styled(EventFill)`
    border-radius: 8px 8px 0 0;
`
export const DateHeader = styled.div`
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    height: 20px;
    color: ${EVENT_TITLE_TEXT_COLOR};
    text-align: center;
`
