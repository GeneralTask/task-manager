import styled from 'styled-components'
import { BACKGROUND_WHITE, BACKGROUND_HOVER } from '../../../../helpers/styles'

export const LabelContainer = styled.div`
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
    right: 0;
`
export const LabelOption = styled.button`
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
    color: #27272a;
`
export const LabelIcon = styled.img`
    margin-right: 5px;
    float: left;
`
export const LabelHeader = styled.div`
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 600;
    font-size: 11px;
    line-height: 16px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #a1a1aa;
    padding: 5px;
`
