import { DateTime } from 'luxon'
import { useState } from 'react'
import { EVENTS_REFETCH_INTERVAL, NO_EVENT_TITLE, SINGLE_SECOND_INTERVAL } from '../constants'
import { useGetEvents } from '../services/api/events.hooks'
import { useInterval } from '.'
import { TEvent } from '../utils/types'
import toast, { isActive, updateToast } from '../utils/toast'

interface EventBannerState {
    lastShownAt: number
}
interface EventBannerStates {
    [key: string]: EventBannerState
}

// const EventBanner = ({ event }: EventBannerProps) => {
//     const timeUntilEvent = Math.ceil((new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60)
//     const timeUntilEventMessage = timeUntilEvent > 0 ? `is in ${timeUntilEvent} minutes.` : 'is now.'
//     const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
//     return (
//         <BannerView key={event.id} center={event.conference_call == null}>
//             <MessageView>
//                 <MessageText>Your Meeting</MessageText>
//                 <BannerTitleView>
//                     <OverflowText>{eventTitle}</OverflowText>
//                 </BannerTitleView>
//                 <MessageText>{timeUntilEventMessage}</MessageText>
//             </MessageView>
//             {event.conference_call && <JoinMeetingButton conferenceCall={event.conference_call} />}
//         </BannerView>
//     )
// }

const isMeetingWithin15Minutes = (event: TEvent) => {
    const eventStart = DateTime.fromISO(event.datetime_start)
    const eventEnd = DateTime.fromISO(event.datetime_end)
    return eventStart < DateTime.now().plus({ minutes: 15 }) && eventEnd > DateTime.now()
}

export default function useEventBanners(date: DateTime) {
    const [eventsWithin15Minutes, setEventsWithin15Minutes] = useState<TEvent[]>([])
    const [eventBannerStates, setEventBannerStates] = useState<EventBannerStates>({})
    const { data: events, refetch } = useGetEvents(
        {
            startISO: date.startOf('day').toISO(),
            endISO: date.endOf('day').plus({ minutes: 15 }).toISO(),
        },
        'banner'
    )
    useInterval(refetch, EVENTS_REFETCH_INTERVAL)

    useInterval(
        () => {
            const updatedEvents = events?.filter((event) => isMeetingWithin15Minutes(event))
            if (updatedEvents && updatedEvents !== eventsWithin15Minutes) {
                setEventsWithin15Minutes(updatedEvents)
            }
        },
        SINGLE_SECOND_INTERVAL,
        false
    )

    eventsWithin15Minutes.map((event) => {
        const timeUntilEvent = Math.ceil((new Date(event.datetime_start).getTime() - new Date().getTime()) / 1000 / 60)
        const timeUntilEventMessage = timeUntilEvent > 0 ? `is in ${timeUntilEvent} minutes.` : 'is now.'
        const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
        const lastShownAt = eventBannerStates[event.id]?.lastShownAt || undefined

        if (isActive(event.id)) {
            updateToast(event.id, { message: `${eventTitle} ${timeUntilEventMessage}` })
            if (lastShownAt !== timeUntilEvent) {
                setEventBannerStates({ ...eventBannerStates, [event.id]: { lastShownAt: timeUntilEvent } })
            }
        } else {
            if (
                !lastShownAt ||
                (lastShownAt > timeUntilEvent &&
                    (timeUntilEvent === 10 || timeUntilEvent === 5 || timeUntilEvent === 1 || timeUntilEvent === 0))
            ) {
                setEventBannerStates({ ...eventBannerStates, [event.id]: { lastShownAt: timeUntilEvent } })
                toast(
                    { message: `${eventTitle} ${timeUntilEventMessage}` },
                    {
                        toastId: event.id,
                        autoClose: false,
                        theme: 'light',
                    }
                )
            }
        }
        // dismiss event banner if event is over
        // clean up logic for getting which events are active (probably just get the next 20 mins of events and only filter the next 10 minutes)
    })
}
