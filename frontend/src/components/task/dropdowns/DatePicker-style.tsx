

import styled from 'styled-components'

export const DatePickerContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 20px;
`
export const DatePickerCalendar = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border-radius: 6px;
    background-color: #fff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
`
export const DatePickerInput = styled.input`
    font-size: 16px;
    border: none;
    border-radius: 8px;
    outline: none;
    width: 100%;
    height: 32px;
    padding: 8px 16px;
    &::placeholder {
        color: #bdbdbd
    }
`

// Individual day in the calendar
export const Day = styled.div<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    border-radius: 4px;
    background-color: ${props => props.isSelected ? '#f5f5f5' : '#fff'};
    color: ${props => props.isSelected ? '#000' : '#000'};
    font-size: 14px;
    font-weight: 500;
    padding: 4px;
    margin: 0px;
    &:hover {
        background-color: ${props => props.isSelected ? '#f5f5f5' : '#f5f5f5'};
        color: ${props => props.isSelected ? '#000' : '#000'};
    }
`