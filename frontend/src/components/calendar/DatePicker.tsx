import React from 'react'
import {BottomBar, PickerContainer, TopNav, MonthTable, Icon, MonthYearHeader} from './DatePicker-style'

function DatePickerTable(): JSX.Element {
    

    return (
        <PickerContainer>
            <TopNav>
                <Icon src="images/CaretLeft.svg" alt="Previous Month" />
                <MonthYearHeader>JANUARY 2022</MonthYearHeader>
                <Icon src="images/CaretRight.svg" alt="Next Month" />
            </TopNav>
            <MonthTable>

            </MonthTable>
            <BottomBar>

            </BottomBar>
        </PickerContainer>
    )
}

export const DatePicker = () => {
    return (
            <DatePickerTable />
    )
}