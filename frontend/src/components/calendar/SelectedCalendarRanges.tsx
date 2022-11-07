import { useRef } from 'react'
import { DateTime } from 'luxon'
import { Spacing } from '../../styles'
import useCalendarDrop from './utils/useCalendarDrop'

interface SelectedCalendarRangesProps {
    primaryAccountID: string
    date: DateTime
}

const SelectedCalendarRanges = ({ primaryAccountID, date }: SelectedCalendarRangesProps) => {
    const dummyRef = useRef<HTMLDivElement>(null)

    const { selectedTimes } = useCalendarDrop({
        primaryAccountID,
        date,
        eventsContainerRef: dummyRef,
        isWeekView: true,
    })

    const dates = [...(selectedTimes?.keys() ?? [])]
        .sort((a, b) => {
            return DateTime.fromISO(a).toMillis() - DateTime.fromISO(b).toMillis()
        })
        .map((key) => {
            return DateTime.fromISO(key)
        })
    return (
        <div style={{ padding: Spacing._12 }}>
            {dates.map((key, index) => {
                return (
                    <div key={index}>
                        {key.toLocaleString(DateTime.DATE_FULL)}
                        {selectedTimes?.get(key.toString())?.map((time, index) => {
                            console.log(time.end + 3)
                            console.log(time.start + 3)

                            //zero out hour and minutes and seconds
                            const zeroTime = key.set({ hour: 0, minute: 0, second: 0 })

                            const startTime = zeroTime.plus({ minutes: 15 * (time.end + 3) })
                            const endTime = zeroTime.plus({ minutes: 15 * (time.start + 3) })
                            return (
                                <div key={index}>
                                    {startTime.toLocaleString(DateTime.TIME_SIMPLE)} -{' '}
                                    {endTime.toLocaleString(DateTime.TIME_SIMPLE)}
                                </div>
                            )
                        })}
                        <br />
                    </div>
                )
            })}
        </div>
    )
}

export default SelectedCalendarRanges
