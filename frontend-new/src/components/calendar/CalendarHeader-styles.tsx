import styled from 'styled-components'
import { Colors, Typography } from '../../styles'

export const CalendarHeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`
export const HeaderTopContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 2px solid ${Colors.gray._200};
`
export const HeaderMiddleContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
`
export const HeaderBottomContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 24px;
`
export const CalendarHeaderTitle = styled.span`
    font-size: ${Typography.xSmall.fontSize}px;
    font-weight: ${Typography.weight._500.fontWeight};
    color: ${Colors.gray._600};
`
export const DateDisplay = styled.div`
    font-size: ${Typography.small.fontSize}px;
    font-weight: ${Typography.weight._600.fontWeight};
    color: ${Colors.gray._800};
    text-align: center;
`
export const HoverButton = styled.button<{ main?: boolean }>`
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 50vh;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    color: ${(props) => (props.main ? 'white' : 'black')};

    background-color: ${(props) => (props.main ? Colors.red._1 : 'transparent')};

    &:hover {
        background: ${(props) => (props.main ? Colors.red._1 : Colors.red._2)};
    }
`
export const Icon = styled.img`
    height: 24px;
    width: 24px;
`
