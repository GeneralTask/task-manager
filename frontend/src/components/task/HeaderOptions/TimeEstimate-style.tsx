import styled from 'styled-components'
import { BACKGROUND_HOVER, BACKGROUND_WHITE, DIVIDER_LIGHTGRAY, ICON_HOVER, TEXT_DARKGRAY } from '../../../helpers/styles'

export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 0 5px lightgray;
    z-index: 1;
    top: 100%;
    padding: 10px;
    cursor: default;
`

export const TopNav = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 10%;
    width: 100%;
    border-bottom: 1px solid ${DIVIDER_LIGHTGRAY};
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

export const TimeButton = styled.button`
    font-size: 14px;
    display: flex;
    min-width: 100px;
    cursor: pointer;
    padding: 5px;
    margin: 5px;
    text-align: left;
    background: ${BACKGROUND_WHITE};
    border: none;
    &:hover {
        background: ${BACKGROUND_HOVER};
        font-weight: 600;
    }
    border-radius: 6px;

    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;


    /* Grey-800 */

    color: #27272A;
`
