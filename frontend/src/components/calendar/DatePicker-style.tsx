import styled from 'styled-components'
import { TEXT_DARKGRAY, DIVIDER_LIGHTGRAY } from '../../helpers/styles'




export const PickerContainer = styled.div`
    display: block;
    width: 250px;
    height: 350px;
    margin: 0 auto;
    position: relative;
    color: black;
    border-radius: 10px;
    // border: 1px solid black;
    margin: 10px;
    box-shadow: 0 0 5px lightgray;
`

export const TopNav = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    // padding: 0 10px;
    height: 15%;
    width: 100%;
    border-bottom: 1px solid ${DIVIDER_LIGHTGRAY};
    border-radius: 10px 10px 0 0;
`

export const MonthTable = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 70%;
    width: 100%;
`

export const BottomBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 15%;
    width: 100%;
    border-top: 1px solid ${DIVIDER_LIGHTGRAY};
    border-radius: 0 0 10px 10px;
`

export const Icon = styled.img`
    height: 16px;
    width: 16px;
    padding: 10px;
`

export const MonthYearHeader = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: ${TEXT_DARKGRAY};
`