import { useState } from 'react'
import { Calendar, CalendarBaseStylesNames, DayModifiers } from '@mantine/dates'
import { Styles } from '@mantine/styles'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { TDailyTaskCompletion, useGetDailyTaskCompletionByMonth } from '../../services/api/daily_task_completion.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Divider } from '../atoms/SectionDivider'
import GTButton from '../atoms/buttons/GTButton'
import { BodyMedium } from '../atoms/typography/Typography'
import GTPopover from '../radix/GTPopover'
import CompletionLegend from './CompletionLegend'
import DaiilyTaskCompletionBreakdown from './DailyTaskCompletionBreakdown'

const CALENDAR_DAY_SIZE = '26px'
const HIGHEST_SAUTRATION_COUNT = 8

const CompletionLegendContainer = styled.div`
    margin: ${Spacing._12} 0;
    display: flex;
    align-items: center;
    justify-content: center;
`
const CompletionBreakdownContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    padding: ${Spacing._12};
`

const getDayStyleFunction = (completionData: TDailyTaskCompletion[]) => {
    return (date: Date, modifiers: DayModifiers) => {
        let styles: React.CSSProperties = {
            color: Colors.text.black,
        }
        if (modifiers.selected) {
            styles = {
                ...styles,
                borderColor: Colors.accent.pink,
                borderStyle: 'solid',
                borderWidth: Border.stroke.medium,
                backgroundColor: 'inherit',
            }
        }
        if (date.toDateString() === new Date().toDateString()) {
            styles = {
                ...styles,
                backgroundColor: Colors.background.hover,
                color: Colors.text.muted,
            }
        } else if (completionData !== undefined) {
            const formattedDate = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
            const dataForDate = completionData.find((item) => item.date === formattedDate)
            if (dataForDate !== undefined) {
                const totalCompletedItems = dataForDate.sources.reduce((acc, source) => acc + source.count, 0)
                const colorIntensity = totalCompletedItems === 0 ? 0 : totalCompletedItems / HIGHEST_SAUTRATION_COUNT
                const cappedIntensity = colorIntensity > 1 ? 1 : colorIntensity
                const colorIntensityHex = Math.round(cappedIntensity * 255).toString(16)

                styles = {
                    ...styles,
                    backgroundColor: `${Colors.accent.yellow}${colorIntensityHex}`,
                    color: Colors.text.muted,
                }
                if (colorIntensityHex !== '0') {
                    styles = {
                        ...styles,
                        color: Colors.text.black,
                    }
                }
            }
        }
        return styles
    }
}

const CalendarStyles: Styles<CalendarBaseStylesNames, Record<string, string>> = {
    calendarBase: {
        maxWidth: 'none',
        width: '240px',
    },
    calendarHeader: {
        color: Colors.text.light,
        width: '240px',
    },
    day: {
        borderRadius: '50%',
        width: CALENDAR_DAY_SIZE,
        height: CALENDAR_DAY_SIZE,
        margin: Spacing._4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
}

const StreakPopoverContent = () => {
    const [selectedDate, setSelectedDate] = useState<DateTime>(DateTime.local())
    const handleOnChange = (date: Date | null) => {
        if (!date) return
        setSelectedDate(DateTime.fromJSDate(date))
    }

    const { data: previousMonth } = useGetDailyTaskCompletionByMonth(
        selectedDate.minus({ months: 1 }).month,
        selectedDate.minus({ months: 1 }).year
    )
    const { data: currentMonth } = useGetDailyTaskCompletionByMonth(selectedDate.month, selectedDate.year)
    const { data: nextMonth } = useGetDailyTaskCompletionByMonth(
        selectedDate.plus({ months: 1 }).month,
        selectedDate.plus({ months: 1 }).year
    )
    const dataForMonth = [...(previousMonth ?? []), ...(currentMonth ?? []), ...(nextMonth ?? [])]
    const dayStyle = getDayStyleFunction(dataForMonth)

    return (
        <div>
            <Calendar
                value={selectedDate.toJSDate()}
                onChange={handleOnChange}
                firstDayOfWeek="sunday"
                allowLevelChange={false}
                size="sm"
                dayStyle={dayStyle}
                styles={CalendarStyles}
            />
            <CompletionLegendContainer>
                <CompletionLegend />
            </CompletionLegendContainer>
            <Divider />
            <CompletionBreakdownContainer>
                <BodyMedium color="title">{selectedDate.toFormat('EEE, LLL d')}</BodyMedium>
                <DaiilyTaskCompletionBreakdown date={selectedDate} />
            </CompletionBreakdownContainer>
        </div>
    )
}

const StreakPopover = () => {
    return (
        <GTPopover
            content={<StreakPopoverContent />}
            align="start"
            trigger={<GTButton styleType="icon" icon={icons.fire} />}
            removePadding
        />
    )
}

export default StreakPopover
