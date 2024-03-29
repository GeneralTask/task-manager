import { scrollbarWidth } from '@xobotyi/scrollbar-width'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { Icon } from '../atoms/Icon'

export const CELL_HEIGHT_VALUE = 64
export const CELL_HEIGHT = `${CELL_HEIGHT_VALUE}px`
export const TABLE_WIDTH_PERCENTAGE = '100%'
export const CELL_TIME_WIDTH = '50px'
export const CELL_BORDER_WIDTH = '3px'
export const CELL_LEFT_MARGIN = '6px'
export const CALENDAR_DEFAULT_SCROLL_HOUR = 8
export const EVENT_BOTTOM_PADDING = 2.5
export const CALENDAR_DAY_HEADER_HEIGHT = 40
export const DEFAULT_EVENT_DURATION_IN_MINUTES = 30
export const DEFAULT_EVENT_HEIGHT = (CELL_HEIGHT_VALUE * DEFAULT_EVENT_DURATION_IN_MINUTES) / 60
export const EVENT_CREATION_INTERVAL_IN_MINUTES = 15
export const EVENT_CREATION_INTERVAL_HEIGHT = (CELL_HEIGHT_VALUE * EVENT_CREATION_INTERVAL_IN_MINUTES) / 60
export const EVENT_CREATION_INTERVAL_PER_HOUR = 60 / EVENT_CREATION_INTERVAL_IN_MINUTES

export type TEventBodyHeight = 'long' | 'medium' | 'short'

const getEventWidth = (squishFactor: number) => `calc(
    (${TABLE_WIDTH_PERCENTAGE} - ${CELL_BORDER_WIDTH} - ${CELL_LEFT_MARGIN}) * 1/(${squishFactor})
)`

export const CalendarWeekDateHeaderContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-left: ${CELL_TIME_WIDTH};
    padding-right: ${scrollbarWidth()}px;
`

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
export const AllDaysContainer = styled.div`
    width: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    position: relative;
    overflow: auto;
`
export const CalendarTableStyle = styled.table`
    border-collapse: collapse;
    width: ${TABLE_WIDTH_PERCENTAGE};
`
export const CalendarTimesTableStyle = styled.table`
    border-collapse: collapse;
    user-select: none;
`
export const CalendarRow = styled.tr`
    display: block;
    height: ${CELL_HEIGHT};
`
export const CalendarTD = styled.td<{ borderLeft?: boolean }>`
    display: block;
    border-top: ${Border.stroke.medium} solid ${Colors.background.hover};
    ${({ borderLeft }) => borderLeft && `border-left: ${Border.stroke.medium} solid ${Colors.background.hover};`}
    height: 100%;
`
export const CalendarCell = styled.div`
    width: ${CELL_TIME_WIDTH};
    padding-top: ${Spacing._12};
    ${Typography.label.small}
    color: ${Colors.text.light};
    text-align: center;
`
interface EventBodyStyleProps {
    eventBodyHeight: number
    topOffset: number
    squishFactor: number
    leftOffset: number
    eventHasEnded: boolean
    isBeingDragged?: boolean
    isDisabled?: boolean
    isSelected?: boolean
}
// using attrs as recommended by styled-components to avoid re-creating style class for every drag state
export const EventBodyStyle = styled.div.attrs<EventBodyStyleProps>((props) => ({
    style: {
        squishFactor: props.squishFactor,
        leftOffset: props.leftOffset,
        width: getEventWidth(props.squishFactor),
        height: props.eventBodyHeight - EVENT_BOTTOM_PADDING,
        top: props.topOffset,
        left: `calc(100% - ${TABLE_WIDTH_PERCENTAGE} + ${CELL_LEFT_MARGIN} + (${getEventWidth(props.squishFactor)}) * ${
            props.leftOffset
        })`,
        opacity: props.eventHasEnded && !props.isBeingDragged ? 0.5 : 1,
        zIndex: props.isBeingDragged || props.isSelected ? 1 : 0,
        cursor: props.isDisabled ? 'default' : 'pointer',
    },
}))<EventBodyStyleProps>`
    position: absolute;
    display: flex;
`
export const EventInfoContainer = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    position: absolute;
    z-index: 1;
`
export const EventInfo = styled.div<{ type: TEventBodyHeight }>`
    display: flex;
    padding: 0 ${Spacing._8} 0 ${Spacing._12};
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    gap: ${Spacing._4};
    ${({ type }) =>
        type === 'long' &&
        `
            flex-direction: column;
            justify-content: flex-start;
            padding-top: ${Spacing._8};
        `};
    ${({ type }) =>
        type === 'medium' &&
        `
            flex-direction: column;
            justify-content: center;
        `};
    ${Typography.body.small};
`
export const EventIconAndTitle = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    max-height: 100%;
    min-width: 0;
`
export const EventIcon = styled(Icon)<{ isShort: boolean }>`
    width: ${({ isShort }) => (isShort ? Spacing._8 : Spacing._16)};
    ${({ isShort }) => isShort && `margin: 0 ${Spacing._4};`}
`
export const EventTitle = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`
export const EventTime = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.text.light};
    max-height: 100%;
    white-space: nowrap;
    overflow: hidden;
`
export const EventFill = styled.div<{
    squareStart: boolean
    squareEnd: boolean
    isSelected: boolean
    backgroundColorHex: string
}>`
    width: 100%;
    height: 100%;
    outline: ${Border.stroke.medium} solid ${(props) => (props.isSelected ? Colors.legacyColors.purple : 'transparent')};
    box-sizing: border-box;
    box-shadow: ${Shadows.deprecated_light};
    /* add opacity to background color */
    background-color: ${(props) => `${props.backgroundColorHex}1A`};
    border-top-left-radius: ${(props) => (props.squareStart ? '0' : Border.radius.small)};
    border-top-right-radius: ${(props) => (props.squareStart ? '0' : Border.radius.small)};
    border-bottom-left-radius: ${(props) => (props.squareEnd ? '0' : Border.radius.small)};
    border-bottom-right-radius: ${(props) => (props.squareEnd ? '0' : Border.radius.small)};
    ::before {
        content: '';
        background-color: ${Colors.background.white};
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: -1;
        border-radius: ${Border.radius.small};
    }
`
export const CalendarDayHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: ${CALENDAR_DAY_HEADER_HEIGHT}px;
    position: sticky;
    top: 0;
    z-index: 2;
    margin: 0 auto;
`
export const DayHeaderText = styled.div<{ isToday: boolean; isPreviewMode: boolean }>`
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._8};
    color: ${(props) => (props.isToday ? Colors.text.white : Colors.text.black)};
    background-color: ${(props) =>
        !props.isToday ? 'transparent' : props.isPreviewMode ? Colors.legacyColors.blue : Colors.legacyColors.purple};
    ${Typography.body.large};
`
export const CalendarContainer = styled.div<{ isExpanded: boolean; showShadow: boolean; hasLeftBorder: boolean }>`
    min-width: 300px;
    ${(props) => !props.isExpanded && `width: 300px;`}
    height: 100%;
    flex: ${(isExpanded) => (isExpanded ? '1' : '0')};
    background-color: ${Colors.background.sub};
    display: flex;
    z-index: 1;
    box-shadow: ${({ showShadow }) => (showShadow ? Shadows.deprecated_light : 'none')};
    flex-direction: column;
    border-left: ${({ hasLeftBorder }) => (hasLeftBorder ? Border.stroke.medium : 'none')} solid
        ${Colors.background.border};
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
    width: ${CELL_TIME_WIDTH};
`
export const DropPreview = styled.div<{ isVisible: boolean; offset: number }>`
    position: absolute;
    width: 100%;
    height: ${DEFAULT_EVENT_HEIGHT}px;
    border: 2px dashed ${Colors.legacyColors.purple};
    display: ${(props) => (props.isVisible ? 'block' : 'none')};
    border-radius: ${Border.radius.medium};
    box-sizing: border-box;
    top: ${(props) => props.offset}px;
    z-index: 1;
    background-color: ${Colors.legacyColors.dropIndicator};
`
