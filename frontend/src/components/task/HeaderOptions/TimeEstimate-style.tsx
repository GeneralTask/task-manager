import styled from 'styled-components'
import { DIVIDER_LIGHTGRAY, ICON_HOVER, TEXT_DARKGRAY, TEXT_GRAY } from '../../../helpers/styles'

export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 0 5px lightgray;
    z-index: 1;
    top: 100%;
    width: 200px;
    padding: 10px;
    cursor: default;
`

export const TopBar = styled.div`
    display: flex;
    /* justify-content: space-between; */
    align-items: center;
`

export const Header = styled.span`
    font-family: Switzer-Variable;
    width: max-content;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    color: ${TEXT_GRAY};
    padding: 5px;
`

export const CloseButton = styled.img`
    height: 16px;
    width: 16px;
    padding: 10px;
    cursor: pointer;
`

export const TimeInput = styled.input`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    color: ${TEXT_GRAY};

    outline: none;
    font-size: 16px;
    color: ${TEXT_DARKGRAY};
    min-width: 0;
    cursor: pointer;
    border: none;
    outline: none;
    -moz-appearance: textfield;
    flex: 1;
    background: none;
    text-align: center;

`
export const TimeInputContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    flex-direction: row;

    background: ${ICON_HOVER};
    border-radius: 8px;
`

export const TimeButton = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 500;
    font-size: 15px;
    color: ${TEXT_GRAY};

    display: flex;
    align-items: center;
    height: 10%;
    padding: 10px;
    margin: 5px;
    border-radius: 10px;
    color: ${TEXT_DARKGRAY};
    &:hover {
        background-color: ${ICON_HOVER};
    }
    cursor: pointer;
`
