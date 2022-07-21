import { Colors, Shadows, Spacing } from '../../styles'
import { weight, xSmall, xxSmall } from '../../styles/typography'

import styled from 'styled-components'

export const PickerContainer = styled.div`
    display: block;
    width: fit-content;
    height: fit-content;
    position: absolute;
    background-color: ${Colors.background.white};
    border-radius: 12px;
    box-shadow: ${Shadows.medium};
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
    border-bottom: 1px solid ${Colors.background.light};
`
export const DayTable = styled.table`
    width: 100%;
    padding-bottom: 6px;
    border-bottom: 1px solid ${Colors.background.light};
`
export const WeekDay = styled.th`
    position: static;
    width: 24px;
    font-weight: ${weight._500};
    font-size: ${xxSmall.fontSize};
    line-height: ${xxSmall.lineHeight};
    color: ${Colors.text.light};
`
export const BottomBar = styled.div`
    display: flex;
    justify-content: center;
    padding-bottom: 12px;
`
export const MonthYearHeader = styled.div`
    font-style: normal;
    font-weight: ${weight._500};
    font-size: ${xSmall.fontSize};
    line-height: ${xSmall.lineHeight};
    color: ${Colors.text.light};
`
export const HoverButton = styled.button<{ isToday: boolean; isSelected: boolean }>`
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
        background: ${(props) =>
            props.isSelected
                ? Colors.gtColor.secondary
                : props.isToday
                ? Colors.status.red.light
                : Colors.background.mid};
    }
    background: ${(props) =>
        props.isSelected ? Colors.gtColor.secondary : props.isToday ? Colors.status.red.light : 'transparent'};
`
export const DayLabel = styled.span<{ grayed: boolean; isSelected: boolean }>`
    position: static;
    width: 24px;
    height: 13px;
    left: 0px;
    top: 5.5px;

    font-weight: ${weight._500};
    font-size: ${xxSmall.fontSize};
    line-height: ${xxSmall.lineHeight};

    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;

    color: ${(props) => (props.isSelected ? Colors.text.light : props.grayed ? Colors.text.light : Colors.text.light)};
`
export const BottomDateView = styled.div`
    display: flex;
    justify-content: space-between;
    width: 90%;
    align-items: center;
    border: 1px solid ${Colors.background.light};
    border-radius: 10px;
`
export const CurrentDateText = styled.span`
    font-weight: ${weight._500};
    font-size: ${xSmall.fontSize};
    line-height: ${xSmall.lineHeight};
    width: 100%;
    color: ${Colors.text.light};
`
export const IconContainer = styled.div`
    padding: ${Spacing.padding._8};
`
