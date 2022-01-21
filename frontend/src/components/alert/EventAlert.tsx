import React from 'react'
import styled from 'styled-components'
import { SHADOW_EVENT_ALERT, TASKS_BACKGROUND_GRADIENT, TASKS_BACKROUND, TEXT_BLACK } from '../../helpers/styles'
import { useAppSelector } from '../../redux/hooks'
import JoinConferenceButton from '../task/JoinConferenceButton'

const EventAlertContainer = styled.div`
    flex: 1;
    overflow: scroll;
    flex-direction: column;
    background-image: linear-gradient(to bottom right, ${TASKS_BACKGROUND_GRADIENT}, ${TASKS_BACKROUND} 90%);
    min-width: 600px;
    padding-top: 10px;
`
const EventAlertContentContainer = styled.div`
    display: flex;
    width: 500px;
    height: 40px;
    background-color: white;
    margin: 10px auto;
    border-radius: 10px;
    padding: 5px 10px;
    font-size: 13px;
    line-height: 16px;
    font-style: normal;
    font-weight: bold;
    color: ${TEXT_BLACK};
    box-shadow: ${SHADOW_EVENT_ALERT};
`
const EventAlertHeader = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;
`
const EventAlertHeaderChild = styled.div`
    white-space: nowrap;
`
const EventAlertEventTitle = styled.div`
    min-width: 0;
    background-color: #F4F4F5;
    padding: 2px 4px;
    border-radius: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
`

interface EventAlertProps {
    children: JSX.Element
}

export default function EventAlert({ children }: EventAlertProps): JSX.Element {
    const eventList = useAppSelector((state) => state.tasks_page.events.event_list)
    const soonEvents = eventList.filter((event) => {
        const eventDate = new Date(event.datetime_start)
        const eventDuration = ((new Date(event.datetime_end)).getTime() - eventDate.getTime()) / 1000 / 60
        const minutesUntilEvent = Math.ceil((eventDate.getTime() - new Date().getTime()) / 1000 / 60)
        return minutesUntilEvent > (-1 * eventDuration) && minutesUntilEvent < 20
    })
    const eventAlertElements: JSX.Element[] = []
    if (soonEvents.length > 0) {
        for (const event of soonEvents) {
            const tempDate = new Date(event.datetime_start)
            const eventDuration = Math.ceil((tempDate.getTime() - new Date().getTime()) / 1000 / 60)
            eventAlertElements.push(
                <EventAlertContentContainer className='event-alert' key={event.id}>
                    <EventAlertHeader>
                        <EventAlertHeaderChild>
                            Your event&nbsp;
                        </EventAlertHeaderChild>
                        <EventAlertEventTitle>{event.title}</EventAlertEventTitle>
                        <EventAlertHeaderChild>
                            &nbsp;{eventDuration > 0 ? `starts in ${eventDuration} minutes` : 'is now.'}
                        </EventAlertHeaderChild>
                        {event.conference_call && <JoinConferenceButton conferenceCall={event.conference_call} />}
                    </EventAlertHeader>
                </EventAlertContentContainer>
            )
        }
    }

    return (
        <EventAlertContainer>
            {eventAlertElements}
            {children}
        </EventAlertContainer>
    )
}
