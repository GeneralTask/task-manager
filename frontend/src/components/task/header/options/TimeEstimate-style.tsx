import styled from 'styled-components'
import { BACKGROUND_HOVER, BACKGROUND_WHITE, GRAY_400, GRAY_800, TEXT_DARKGRAY } from '../../../../helpers/styles'

const TIME_ESTIMATOR_WIDTH = 150
const TIME_ESTIMATOR_PADDING = 10
export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${TIME_ESTIMATOR_WIDTH}px;
    height: 400px;
    position: absolute;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 0 5px lightgray;
    z-index: 1;
    top: 100%;
    padding: ${TIME_ESTIMATOR_PADDING}px;
    cursor: default;
    transform: translateX(
        ${-1 * (TIME_ESTIMATOR_WIDTH / 2 - TIME_ESTIMATOR_PADDING * 2)}px);
`

export const Header = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 600;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${GRAY_400};
    padding: 5px;
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
    min-width: 120px;
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
    color: ${GRAY_800};
`
