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
`
const EventAlertContentContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 500px;
    height: 40px;
    background-color: white;
    margin: 20px auto;
    border-radius: 10px;
    padding: 5px 5px 5px 10px;
    font-size: 13px;
    line-height: 16px;
    font-style: normal;
    font-weight: bold;
    color: ${TEXT_BLACK};
    box-shadow: ${SHADOW_EVENT_ALERT};
`
const EventAlertHeader = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
`
const EventAlertEventTitle = styled.div`
    position: inline;
    background-color: #F4F4F5;
    padding: 2px 4px;
    border-radius: 6px;
`

interface EventAlertProps {
    children: JSX.Element
}

export default function EventAlert({ children }: EventAlertProps): JSX.Element {
    const eventList = useAppSelector((state) => state.tasks_page.events.event_list)
    const nextSoonEvent = eventList.find((event) => {
        const eventDate = new Date(event.datetime_start)
        const minutesUntilEvent = Math.ceil((eventDate.getTime() - new Date().getTime()) / 1000 / 60)
        return minutesUntilEvent >= 0 && minutesUntilEvent < 20
    })

    let eventAlertElement = null
    if (nextSoonEvent) {
        const tempDate = new Date(nextSoonEvent.datetime_start)
        eventAlertElement = (
            <EventAlertContentContainer id='event-alert'>
                <EventAlertHeader>
                    Your event&nbsp;
                    <EventAlertEventTitle>{nextSoonEvent.title}</EventAlertEventTitle>
                    &nbsp;in {Math.ceil((tempDate.getTime() - new Date().getTime()) / 1000 / 60)} minutes.
                </EventAlertHeader>
                {nextSoonEvent.conference_call && <JoinConferenceButton conferenceCall={nextSoonEvent.conference_call} />}
            </EventAlertContentContainer>
        )
    }

    return (
        <EventAlertContainer>
            {eventAlertElement}
            {children}
        </EventAlertContainer>
    )
}
