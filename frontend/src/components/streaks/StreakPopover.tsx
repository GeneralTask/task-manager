import { useState } from 'react'
import { Calendar, CalendarBaseStylesNames, DayModifiers } from '@mantine/dates'
import { Styles } from '@mantine/styles'
import { DateTime } from 'luxon'
import { useGetDailyTaskCompletionByMonth } from '../../services/api/daily_task_completion.hooks'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import GTButton from '../atoms/buttons/GTButton'
import GTPopover from '../radix/GTPopover'

const CALENDAR_DAY_SIZE = '26px'

const CalendarStyles: Styles<CalendarBaseStylesNames, Record<string, any>> = {
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
    const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.local())
    const handleOnChange = (date: Date | null) => {
        if (!date) {
            return
        }
        setCurrentDate(DateTime.fromJSDate(date))
    }

    const { data } = useGetDailyTaskCompletionByMonth(currentDate.month, currentDate.year)

    const dayStyle = (date: Date, modifiers: DayModifiers) => {
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
        } else if (data !== undefined) {
            const formattedDate = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
            const dataForDate = data.find((item) => item.date === formattedDate)
            if (dataForDate !== undefined) {
                const totalCompletedItems = dataForDate.sources.reduce((acc, source) => acc + source.count, 0)
                const colorIntensity = totalCompletedItems === 0 ? 0 : totalCompletedItems / 8
                const intensityNormalized = colorIntensity > 1 ? 1 : colorIntensity
                const colorIntensityHex = Math.round(intensityNormalized * 255).toString(16)

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

    return (
        <Flex>
            <Calendar
                value={currentDate.toJSDate()}
                onChange={handleOnChange}
                firstDayOfWeek="sunday"
                allowLevelChange={false}
                size="sm"
                dayStyle={dayStyle}
                styles={CalendarStyles}
            />
        </Flex>
    )
}

const StreakPopover = () => {
    return (
        <GTPopover
            content={<StreakPopoverContent />}
            align="start"
            trigger={<GTButton styleType="icon" icon={icons.fire} />}
        />
    )
}

export default StreakPopover
