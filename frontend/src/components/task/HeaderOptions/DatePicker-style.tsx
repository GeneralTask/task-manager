import styled from 'styled-components'
import { TEXT_DARKGRAY, DIVIDER_LIGHTGRAY, ICON_HOVER, TEXT_GRAY, TEXT_LIGHTGRAY } from '../../../helpers/styles'

export const PickerContainer = styled.div`
    display: block;
    width: fit-content;
    height: fit-content;
    position: absolute;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 0 5px lightgray;
    z-index: 1;
    top: 100%;
    right: 0;
    cursor: default;
`
export const TopNav = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 5px 0 5px;
`
export const MonthContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: start;
    flex-direction: column;
    padding: 12px;
`
export const WeekDayTable = styled.table`
    width: 100%;
    padding-bottom: 6px;
    border-bottom: 1px solid ${DIVIDER_LIGHTGRAY};
`
export const DayTable = styled.table`
    width: 100%;
    padding-bottom: 6px;
    border-bottom: 1px solid ${DIVIDER_LIGHTGRAY};
`
export const WeekDay = styled.th`
    position: static;
    width: 24px;

    font-family: Switzer;
    font-style: normal;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    color: ${TEXT_GRAY};
`
export const BottomBar = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom: 12px;
`
export const Icon = styled.img`
    height: 16px;
    width: 16px;
    padding: 10px;
`
export const MonthYearHeader = styled.div`
    font-family: Switzer;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    color: ${TEXT_DARKGRAY};
`
export const HoverButton = styled.button<{ isToday: boolean, isSelected: boolean }>`
    background: ${props => props.isSelected ? '#5C31D7' : props.isToday ? '#FF000022' : 'transparent'};
    height: 30px;
    width: 30px;
    cursor: pointer;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: none;
    border-radius: 50%;
    display: flex;
    &:hover {
        background: ${ICON_HOVER};
    }
`
export const DayLabel = styled.span<{ grayed: boolean, isSelected: boolean }>`
    position: static;
    width: 24px;
    height: 13px;
    left: 0px;
    top: 5.5px;

    font-family: Switzer;
    font-style: normal;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;

    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;

    color: ${props => props.isSelected ? '#FFFFFF' : props.grayed ? TEXT_GRAY : TEXT_DARKGRAY};
`
export const BottomDateView = styled.div`
    display: flex;
    justify-content: space-between;
    width: 90%;
    align-items: center;
    border: 1px solid ${DIVIDER_LIGHTGRAY};
    border-radius: 10px;
`
export const CurrentDateText = styled.span`
    font-family: Switzer;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    line-height: 19px;
    width: 100%;
    color: ${TEXT_DARKGRAY};
`