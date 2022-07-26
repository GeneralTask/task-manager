import React from 'react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import { DateTime } from 'luxon'
import { icons, logos } from '../../styles/images'
import { TEvent } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
// import { CELL_TIME_WIDTH } from "../calendar/CalendarEvents-styles"

// Calendar Modal (GCal)
// right now, right offset is done manually to check other functionality
// TO DO: CHANGE RIGHT OFFSET ONCE DONE WITH OTHER STYLING BUGS
const EventBoxStyle = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: ${Spacing.padding._16} 0px;
    gap: 10px;

    position: absolute;
    right: 110px;
    width: 315px;

    background: ${Colors.background.white};
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.16);
    border-radius: ${Border.radius.small};
`
// Frame 34281
const EventBody = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
// Frame 34279
const EventHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;

    gap: 118px;
    width: 280px;
`
// Frame 34280
const EventHeaderIcons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    gap: ${Spacing.margin._8};
    width: 147px;
`
// Details Content
const EventDetail = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0px;
    gap: 10px;
    width: 315px;
`
// Task Title (Title + Date)
const EventTitleSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    padding: 0px 18px;
    gap: 10px;
`
// Task Title for Date
const EventDateContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 2px 0px 0px;
    gap: ${Spacing.padding._8};
`
// Comment Section
const DescriptionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    word-wrap: normal;
    overflow-wrap: anywhere;
`

// Button
// TO DO: Create a new button component for event detail
// should be similar to GTButton, take in value and icon source prop
const ExternalLinkButton = styled.button`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    padding: 6px 10px;
    gap: 6px;

    width: 280px;
    height: 42px;

    background: ${Colors.background.white};
    border: 1px solid ${Colors.button.secondary.hover};
    box-shadow: ${Shadows.xSmall};
    border-radius: ${Border.radius.regular};
    cursor: pointer;

    color: ${Colors.text.black};
    ${Typography.label};
`
// Button for closing popup
const CloseButton = styled(NoStyleButton)`
    padding: ${Spacing.padding._8};
    border-radius: 50vh;
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
// Event Title
const EventTitle = styled.span`
    ${Typography.subtitle};
    color: ${Colors.text.black};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
`
// Task Title
const EventDate = styled.span`
    ${Typography.label};
    color: ${Colors.text.black};
`
// Event Description
const Description = styled.span`
    ${Typography.label};
    color: ${Colors.text.light};
    padding: 0px 18px;
`

interface EventDetailProps {
    event: TEvent
    date: DateTime
    // hasPopupVisible: boolean
    handleClose: React.MouseEventHandler<HTMLButtonElement>
}

// TO DO: figure out edge cases (long events)
// TO DO: figure out exit logic
// TO DO: figure out CSS styling for where popup goes (for expanded and collapsed)

const EventDetailPopup = ({ event, date, handleClose }: EventDetailProps) => {
    const startTime = DateTime.fromISO(event.datetime_start)
    const endTime = DateTime.fromISO(event.datetime_end)

    const startTimeString = startTime.toFormat('h:mm') // ex: 3:00
    const endTimeString = endTime.toFormat('h:mm a') // ex: 3:30 PM

    return (
        <EventBoxStyle>
            <EventBody>
                <EventHeader>
                    <Icon source={logos.gcal} size="xSmall" />
                    <EventHeaderIcons>
                        <Icon source={icons.trash_gray} size="xSmall" />
                        <CloseButton onClick={handleClose}>
                            <Icon source={icons.exit} size="small" />
                        </CloseButton>
                    </EventHeaderIcons>
                </EventHeader>
                <EventDetail>
                    <EventTitleSection>
                        <EventTitle>{event.title}</EventTitle>
                        <EventDateContainer>
                            <Icon source={icons.calendar_blank_darkgray} size="xSmall" />
                            <EventDate>
                                {`${date.toFormat('cccc, LLLL d')}`} · {`${startTimeString} - ${endTimeString}`}
                            </EventDate>
                            {/* <EventDateText>Thursday, June 23 · 3:00 - 3:30 pm</EventDateText> */}
                        </EventDateContainer>
                    </EventTitleSection>
                    <DescriptionContainer>
                        <Description>{event.body}</Description>
                    </DescriptionContainer>
                </EventDetail>
                <NoStyleAnchor href={event.deeplink} target="_blank">
                    <ExternalLinkButton>
                        <Icon source={icons.external_link_darkgray} size="xSmall" />
                        Google Calendar
                    </ExternalLinkButton>
                </NoStyleAnchor>
            </EventBody>
        </EventBoxStyle>
    )
}

export default EventDetailPopup
