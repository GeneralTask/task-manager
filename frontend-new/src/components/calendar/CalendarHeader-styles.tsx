import styled from 'styled-components'
import { Colors } from '../../styles'

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
    font-size: 18px;
    font-weight: 600;
    color: ${Colors.gray._800};
    line-height: 1.6em;
`
export const DateDisplay = styled.div`
    font-size: 20px;
    font-weight: 600;
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
    background-color: ${(props) => (props.main ? Colors.purple._1 : 'transparent')};

    &:hover {
        background: ${(props) => (props.main ? Colors.purple._2 : Colors.purple._2)};
    }
`
export const Icon = styled.img`
    height: 24px;
    width: 24px;
`
