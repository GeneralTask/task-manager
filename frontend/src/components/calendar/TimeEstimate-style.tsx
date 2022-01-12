import styled from 'styled-components'
import { TEXT_DARKGRAY, DIVIDER_LIGHTGRAY, ICON_HOVER } from '../../helpers/styles'

export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 150px;
    height: 400px;
    margin: 0 auto;
    position: absolute;
    background-color: white;
    border-radius: 10px;
    margin: 10px;
    box-shadow: 0 0 5px lightgray;
    z-index: 1;
    top: 100%;
    right: 0;
    padding: 10px;
    cursor: default;
`

export const TopNav = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    // padding: 10px;
    height: 10%;
    width: 100%;
    border-bottom: 1px solid ${DIVIDER_LIGHTGRAY};
    // border-radius: 10px 10px 0 0;
`

export const Header = styled.div`
    font-size: 16px;
    color: ${TEXT_DARKGRAY};
    padding: 10px;
`

export const CloseButton = styled.img`
    height: 16px;
    width: 16px;
    padding: 10px;
    cursor: pointer;
`

export const TimeInput = styled.input`
    outline: none;
    font-size: 16px;
    color: ${TEXT_DARKGRAY};
    padding: 10px;
    margin: 5px;
    width: 80%;
    cursor: pointer;
`

export const TimeButton = styled.div`
    display: flex;
    align-items: center;
    height: 10%;
    width: 80%;
    padding: 10px;
    margin: 5px;
    border-radius: 10px;
    color: ${TEXT_DARKGRAY};
    &:hover {
        background-color: ${ICON_HOVER};
    }
    cursor: pointer;
`