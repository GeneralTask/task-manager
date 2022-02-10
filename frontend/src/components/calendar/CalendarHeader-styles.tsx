import styled from 'styled-components'
import { ACCENT_ACTIVE, ACCENT_MAIN, EVENT_CONTAINER_COLOR, ICON_HOVER } from '../../helpers/styles'

export const CalendarHeaderContainer = styled.div`
    height: 50px;
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    padding: 0px 24px;
`
export const DateDisplay = styled.div`
    margin-left: 40px;
    font-size: 20px;
    font-weight: 600;
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

    color: ${props => props.main ? 'white' : 'black'};

    background-color: ${props => props.main ? ACCENT_MAIN : 'transparent'};

    &:hover {
        background: ${props => props.main ? ACCENT_ACTIVE : ICON_HOVER};
    }
`
export const Icon = styled.img`
    height: 16px;
    width: 16px;
`

export const CalendarSidebarContainer = styled.div`
    min-width: 475px;
    height: 100%;
    background-color: ${EVENT_CONTAINER_COLOR};
    box-shadow: -5px 0px 20px 5px whitesmoke;
    display: flex;
    flex-direction: column;
`
