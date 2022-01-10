import React, {useCallback, useState} from 'react'
import {BottomBar, PickerContainer, TopNav, MonthContainer, Icon, MonthYearHeader, HoverButton} from './DatePicker-style'


// interface DatePickerProps {
//     date: Date,
//     setDate: React.Dispatch<React.SetStateAction<Date>>
// }
export default function DatePicker(): JSX.Element {
    
    const [date, setDate] = useState<Date>(new Date())
    const monthyear = date.toLocaleDateString('default', { month: 'long', year: 'numeric' }).toUpperCase()

    const nextMonth = useCallback(() => setDate(date => {
        const newDate = new Date(date)
        newDate.setMonth(date.getMonth() + 1)
        return newDate
    }), [date, setDate])
    const prevMonth = useCallback(() => setDate(date => {
        const newDate = new Date(date)
        newDate.setMonth(date.getMonth() - 1)
        return newDate
    }), [date, setDate])

    const daysInMonth = (): number => {
        const temp_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return temp_date.getDate()
    }

    const firstDayOfMonth = (): number => {
        const temp_date = new Date(date.getFullYear(), date.getMonth(), 1)
        return temp_date.getDay()
    }
    const lastDayOfMonth = (): number => {
        const temp_date = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return temp_date.getDay()
    }
        

    const monthTable = (): JSX.Element => {
        const month = date.getMonth()
        const year = date.getFullYear()
        return (
            <table>
                <thead>
                    <tr>
                        <th>S</th>
                        <th>M</th>
                        <th>T</th>
                        <th>W</th>
                        <th>T</th>
                        <th>F</th>
                        <th>S</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        [...Array(firstDayOfMonth())].map((i, index) => {
                            const day = index - firstDayOfMonth() + 1
                            const tmpDate = new Date(year, month, day)
                            return (
                                <>
                                    <td key={i}>
                                        <HoverButton onClick={() => setDate(tmpDate)}>
                                            {tmpDate.getDate()}
                                        </HoverButton>
                                    </td>
                                    {
                                        tmpDate.getDay() === 6 && <tr key={index}></tr>
                                    }
                                </>
                            )
                        })
                    }
                    {
                        [...Array(daysInMonth())].map((i, index) => {
                            const day = index + 1
                            const tmpDate = new Date(year, month, day)
                            return (
                                <>
                                    <td key={i}>
                                        <HoverButton onClick={() => setDate(tmpDate)}>
                                            {tmpDate.getDate()}
                                        </HoverButton>
                                    </td>
                                    {
                                        tmpDate.getDay() === 6 && <tr key={index}></tr>
                                    }
                                </>
                            )
                        })
                    }
                    {
                        [...Array(6-lastDayOfMonth())].map((i, index) => {
                            const day = index + daysInMonth() + 1
                            const tmpDate = new Date(year, month, day)
                            return (
                                <>
                                    <td key={i}>
                                        <HoverButton onClick={() => setDate(tmpDate)}>
                                            {tmpDate.getDate()}
                                        </HoverButton>
                                    </td>
                                    {
                                        tmpDate.getDay() === 6 && <tr key={index}></tr>
                                    }
                                </>
                            )
                        })
                    }
                </tbody>
            </table>
        )
    }
        


    return (
        <PickerContainer>
            <TopNav>
                <HoverButton onClick={prevMonth}>
                    <Icon src="images/CaretLeft.svg" alt="Previous Month"/>
                </HoverButton>
                <MonthYearHeader>{monthyear}</MonthYearHeader>
                <HoverButton onClick={nextMonth}>
                    <Icon src="images/CaretRight.svg" alt="Next Month"/>
                </HoverButton>
            </TopNav>
            <MonthContainer>{monthTable()}</MonthContainer>
            <BottomBar>

            </BottomBar>
        </PickerContainer>
    )
}