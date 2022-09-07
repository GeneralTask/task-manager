import { Border, Colors, Dimensions, Shadows, Spacing, Typography } from '../../styles'
import styled from 'styled-components'

export const CELL_HEIGHT_VALUE = 64
export const CELL_HEIGHT = `${CELL_HEIGHT_VALUE}px`
export const TABLE_WIDTH_PERCENTAGE = '100%'
export const CELL_TIME_WIDTH = '43px'
export const CELL_BORDER_WIDTH = '3px'
export const CELL_LEFT_MARGIN = '6px'
export const EVENT_CONTAINER_COLOR = Colors.background.light
export const EVENT_TITLE_TEXT_COLOR = Colors.text.light
export const EVENT_TIME_TEXT_COLOR = Colors.text.light
export const CALENDAR_TD_COLOR = Colors.background.dark
export const CALENDAR_TIME_COLOR = Colors.text.light
export const CALENDAR_INDICATOR_COLOR = Colors.status.red.default
export const CALENDAR_DEFAULT_SCROLL_HOUR = 8
export const EVENT_BOTTOM_PADDING = 2.5
export const CALENDAR_DAY_HEADER_HEIGHT = 40
export const DEFAULT_EVENT_DURATION_IN_MINUTES = 30
export const DEFAULT_EVENT_HEIGHT = (CELL_HEIGHT_VALUE * DEFAULT_EVENT_DURATION_IN_MINUTES) / 60
export const EVENT_CREATION_INTERVAL_IN_MINUTES = 15
export const EVENT_CREATION_INTERVAL_HEIGHT = (CELL_HEIGHT_VALUE * EVENT_CREATION_INTERVAL_IN_MINUTES) / 60
export const EVENT_CREATION_INTERVAL_PER_HOUR = 60 / EVENT_CREATION_INTERVAL_IN_MINUTES

const getEventWidth = (squishFactor: number) => `calc(
    (${TABLE_WIDTH_PERCENTAGE} - ${CELL_BORDER_WIDTH} - ${CELL_LEFT_MARGIN}) * 1/(${squishFactor})
)`

export const DayContainer = styled.div`
    width: 100%;
    height: fit-content;
    flex: 1;
    display: flex;
    justify-content: center;
    position: relative;
`
export const TimeContainer = styled.div`
    height: 100%;
    justify-content: center;
    position: relative;
`
export const AllDaysContainer = styled.div<{ isScrollDisabled: boolean }>`
    width: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    position: relative;
    overflow: ${(props) => (props.isScrollDisabled ? 'hidden' : 'scroll')};
`
export const CalendarTableStyle = styled.table`
    border-collapse: collapse;
    width: ${TABLE_WIDTH_PERCENTAGE};
`
export const CalendarTimesTableStyle = styled.table`
    border-collapse: collapse;
`
export const CalendarRow = styled.tr`
    display: block;
    height: ${CELL_HEIGHT};
`
export const CalendarTD = styled.td`
    display: block;
    border-top: 1px solid ${CALENDAR_TD_COLOR};
    border-left: 1px solid ${CALENDAR_TD_COLOR};
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
    width: ${CELL_TIME_WIDTH};
    height: 40px;
    margin-top: 4px;
    margin-right: 4px;
    text-align: right;
`
interface EventBodyStyleProps {
    eventBodyHeight: number
    topOffset: number
    squishFactor: number
    leftOffset: number
    eventHasEnded: boolean
    isBeingDragged?: boolean
}
// using attrs as recommended by styled-components to avoid re-creating style class for every drag state
export const EventBodyStyle = styled.div.attrs<EventBodyStyleProps>((props) => ({
    style: {
        squishFactor: props.squishFactor,
        leftOffset: props.leftOffset,
        width: getEventWidth(props.squishFactor),
        height: props.eventBodyHeight - EVENT_BOTTOM_PADDING,
        top: props.topOffset,
        left: `calc(
            100% - ${TABLE_WIDTH_PERCENTAGE} + ${CELL_LEFT_MARGIN} + (${getEventWidth(props.squishFactor)}) * ${props.leftOffset}
        )`,
        opacity: props.eventHasEnded && !props.isBeingDragged ? 0.5 : 1,
        zIndex: props.isBeingDragged ? 1 : 0,
    },
})) <EventBodyStyleProps>`
    position: absolute;
    cursor: pointer;
`
export const EventInfoContainer = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    position: absolute;
    z-index: 1;
    border-radius: ${Border.radius.medium};
`
export const EventInfo = styled.div<{ isLongEvent: boolean }>`
    overflow: hidden;
    white-space: nowrap;
    margin: 0 12px;
    align-items: center;
    ${(props) => (props.isLongEvent ? 'height: 100%;' : 'display: flex;')}
`
export const EventTitle = styled.div<{ isLongEvent: boolean }>`
    font-style: normal;
    font-size: 14px;
    font-weight: 600;
    color: ${EVENT_TITLE_TEXT_COLOR};
    margin-right: ${Spacing._8};
    gap: ${Spacing._8};
    max-height: 100%;
    ${(props) =>
        props.isLongEvent &&
        `
        font-weight: ${Typography.weight.semibold};
        margin-top: ${Spacing.margin._12};
    `}
`
export const EventTime = styled.div`
    color: ${Colors.text.light};
    float: left;
    max-height: 100%;
`
export const EventFill = styled.div<{ squareStart: boolean; squareEnd: boolean; isSelected: boolean }>`
    width: 100%;
    height: 100%;
    background: ${Colors.background.white};
    border: ${Border.stroke.medium} solid ${(props) => (props.isSelected ? Colors.border.gray : EVENT_CONTAINER_COLOR)};
    box-sizing: border-box;
    box-shadow: ${Shadows.light};
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
export const CalendarDayHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: ${CALENDAR_DAY_HEADER_HEIGHT}px;
    position: sticky;
    background-color: ${Colors.background.medium};
    top: 0;
    z-index: 2;
`
export const DayHeaderText = styled.div<{ isToday: boolean }>`
    border-radius: 50vh;
    padding: ${Spacing._4} ${Spacing._8};
    color: ${(props) => (props.isToday ? Colors.text.white : Colors.text.black)};
    background-color: ${(props) => (props.isToday ? Colors.gtColor.primary : Colors.background.medium)};
    ${Typography.body};
`
export const CalendarContainer = styled.div<{ expanded: boolean }>`
    min-width: 300px;
    height: 100%;
    flex: ${(props) => (props.expanded ? '1' : '0')};
    background-color: ${Colors.background.medium};
    display: flex;
    z-index: 1;
    box-shadow: ${Shadows.light};
    flex-direction: column;
`
export const DayAndHeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: fit-content;
`
export const TimeAndHeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: fit-content;
`
export const DropPreview = styled.div<{ isVisible: boolean; offset: number }>`
    position: absolute;
    width: 100%;
    height: ${DEFAULT_EVENT_HEIGHT}px;
    border: 2px dashed ${Colors.gtColor.primary};
    display: ${(props) => (props.isVisible ? 'block' : 'none')};
    border-radius: ${Border.radius.medium};
    box-sizing: border-box;
    top: ${(props) => props.offset}px;
    z-index: 1;
    background-color: ${Colors.background.dropIndicator};
`
export const IconContainer = styled.div`
    width: ${Dimensions.iconSize.xSmall};
`
