import { useMemo, useState } from 'react'
import { useLayoutEffect } from 'react'
import { Calendar } from '@mantine/dates'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { getFormattedDate } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import GTPopover from '../radix/GTPopover'

const CALENDAR_DAY_SIZE = '32px'

const GTDatePickerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    .mantine-Calendar-calendarHeaderLevel {
        ${Typography.deprecated_eyebrow};
    }
`
const DateViewContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: ${Spacing._8};
    padding: ${Spacing._4} ${Spacing._8};
    gap: ${Spacing._8};
    border-radius: ${Border.radius.small};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    background-color: ${Colors.background.base};
`
const DateViewText = styled.span`
    ${Typography.deprecated_bodySmall};
    flex: 1;
`

interface GTDatePickerProps {
    initialDate: DateTime
    setDate: (date: string) => void
    showIcon?: boolean
    onlyCalendar?: boolean
    disabled?: boolean
    isLinearTask?: boolean
}
const GTDatePicker = ({ initialDate, setDate, showIcon = true, onlyCalendar = false, disabled }: GTDatePickerProps) => {
    const [currentDate, setCurrentDate] = useState<DateTime | null>(initialDate)
    const formattedDate = useMemo(() => getFormattedDate(currentDate), [currentDate])

    useLayoutEffect(() => {
        if (!currentDate) return
        if (+currentDate !== +initialDate) {
            setCurrentDate(initialDate)
        }
    }, [initialDate])

    const handleOnChange = (date: Date | null) => {
        if (!date) {
            setDate(DateTime.fromMillis(0).toFormat('yyyy-MM-dd'))
        } else {
            setCurrentDate(DateTime.fromJSDate(date))
            setDate(DateTime.fromJSDate(date).toISO())
        }
    }

    const calendar = (
        <GTDatePickerWrapper>
            <Calendar
                value={currentDate?.toJSDate()}
                onChange={handleOnChange}
                placeholder="Select a Date"
                firstDayOfWeek="sunday"
                allowLevelChange={false}
                size="sm"
                dayStyle={(date, modifiers) => {
                    if (modifiers.selected) {
                        return {
                            backgroundColor: Colors.legacyColors.purple,
                            color: Colors.text.white,
                        }
                    }
                    if (date.toDateString() === new Date().toDateString()) {
                        return {
                            border: `${Border.stroke.medium} solid ${Colors.legacyColors.purple}`,
                            color: Colors.text.black,
                            zIndex: 1,
                        }
                    }
                    if (modifiers.outside) {
                        return {}
                    }
                    return { color: Colors.text.black }
                }}
                styles={{
                    calendarBase: {
                        maxWidth: 'none',
                    },
                    calendarHeaderLevel: {
                        color: Colors.text.light,
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
                }}
                renderDay={(date) => <div onMouseUp={() => handleOnChange(date)}>{date.getDate()}</div>}
            />
            {currentDate?.isValid && (
                <DateViewContainer>
                    <Icon icon={icons.calendar_blank} color="black" />
                    <DateViewText>{currentDate.toFormat('ccc LLL d y')}</DateViewText>
                    <GTButton
                        styleType="icon"
                        tooltipText="Remove due date"
                        icon={icons.x}
                        onClick={() => handleOnChange(null)}
                    />
                </DateViewContainer>
            )}
        </GTDatePickerWrapper>
    )

    if (onlyCalendar) return calendar

    return (
        <div>
            <GTPopover
                content={calendar}
                disabled={disabled}
                align="start"
                trigger={
                    <GTButton
                        styleType="control"
                        icon={showIcon ? icons.clock : undefined}
                        value={formattedDate.dateString}
                        textColor={formattedDate.textColor}
                    />
                }
            />
        </div>
    )
}

export default GTDatePicker
