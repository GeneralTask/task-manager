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
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTPopover from '../radix/GTPopover'

const CALENDAR_DAY_SIZE = '32px'

const GTDatePickerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    .mantine-Calendar-calendarHeaderLevel {
        ${Typography.eyebrow};
    }
`
const DateViewContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: ${Spacing._8};
    padding: ${Spacing._4} ${Spacing._8};
    gap: ${Spacing._8};
    border-radius: ${Border.radius.mini};
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    background-color: ${Colors.background.light};
`
const DateViewText = styled.span`
    ${Typography.bodySmall};
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
const GTDatePicker = ({
    initialDate,
    setDate,
    showIcon = true,
    onlyCalendar = false,
    disabled,
    isLinearTask = false,
}: GTDatePickerProps) => {
    const [currentDate, setCurrentDate] = useState<DateTime | null>(initialDate)
    const [isOpen, setIsOpen] = useState(false)

    useLayoutEffect(() => {
        if (!currentDate) return
        if (+currentDate !== +initialDate) {
            setCurrentDate(initialDate)
        }
    }, [initialDate])

    const formattedDate = useMemo(() => getFormattedDate(currentDate), [currentDate])

    const handleOnChange = (date: Date | null) => {
        if (!date) {
            setDate(DateTime.fromMillis(0).toISO())
        } else {
            setCurrentDate(DateTime.fromJSDate(date))
            if (isLinearTask) {
                const dateTimeUTCMidnight = DateTime.fromJSDate(date).setZone('utc').startOf('day')
                setDate(dateTimeUTCMidnight.toISO())
            } else {
                setDate(DateTime.fromJSDate(date).toISO())
            }
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
                            backgroundColor: Colors.gtColor.primary,
                            color: Colors.text.white,
                        }
                    }
                    if (date.toDateString() === new Date().toDateString()) {
                        return {
                            border: `${Border.stroke.medium} solid ${Colors.gtColor.primary}`,
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
                    <GTIconButton
                        tooltipText="Remove due date"
                        icon={icons.x}
                        color="black"
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
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                content={calendar}
                disabled={disabled}
                align="start"
                trigger={
                    <GTButton
                        styleType="simple"
                        size="small"
                        icon={showIcon ? icons.clock : undefined}
                        value={formattedDate.dateString}
                        textColor={formattedDate.textColor}
                        iconColor={formattedDate.iconColor}
                        onClick={() => setIsOpen(!isOpen)}
                        active={isOpen}
                        disabled={disabled}
                        asDiv
                    />
                }
            />
        </div>
    )
}

export default GTDatePicker
