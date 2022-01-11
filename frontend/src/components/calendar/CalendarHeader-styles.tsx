import styled from 'styled-components'
import { EVENT_CONTAINER_COLOR, ICON_HOVER, SHADOW_PRIMARY } from '../../helpers/styles'

export const CalendarHeaderContainer = styled.div`
    height: 50px;
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    padding: 0px 24px;
`
export const DateDisplay = styled.div`
    margin-left: 40px;
    font-size: 24px;
    font-weight: 600;
`
export const HoverButton = styled.button`
    background-color: transparent;
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background: ${ICON_HOVER};
    }
`
export const Icon = styled.img`
    height: 28px;
    width: 28px;
`

export const CalendarSidebarContainer = styled.div`
    min-width: 475px;
    height: 100%;
    background-color: ${EVENT_CONTAINER_COLOR};
    box-shadow: -5px 0px 20px 5px whitesmoke;
    display: flex;
    flex-direction: column;
    overflow: scroll;
`
