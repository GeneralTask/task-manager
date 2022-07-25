import React, { useState } from 'react'
import styled from 'styled-components'
import { NO_EVENT_TITLE } from '../../../constants'
import { Colors, Spacing, Typography } from '../../../styles'
import { useMeetingBanner } from '../../../services/api/banner.hooks'
import { icons, logos } from '../../../styles/images'
import { Icon } from '../Icon'
import JoinMeetingButton from '../buttons/JointMeetingButton'
import { CursorPointerDiv } from '../../calendar/CalendarHeader'
import NoStyleAnchor from '../NoStyleAnchor'

const FooterView = styled.div`
    position: absolute;
    top: 100%;
    transform: translateY(-100%);
    display: none; // change when ready to use
    flex-direction: column;
    justify-content: center;
    align-items: right;
    height: 170px;
    background-color: ${Colors.background.white};
    width: 100%;
`
const FooterTextView = styled.div`
    display: flex;
    flex-direction: column;
    align-items: space-between;
    justify-content: center;
    flex-shrink: 1;
    margin: ${Spacing.margin._40};
    min-width: 0px;
`
const FooterHeaderArea = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-shrink: 1;
    min-width: 0px;
`
const FooterText = styled.div`
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    color: ${Colors.text.light};
    justify-content: space-between;
    margin-top: ${Spacing.margin._12};
    margin-left: ${Spacing.margin._12};
    align-content: space-between;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    ${Typography.body};
`
const HeaderText = styled.div`
    margin-right: ${Spacing.margin._8};
    color: ${Colors.text.light};
    padding-left: ${Spacing.padding._4};
    border: 2px solid transparent;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    ${Typography.subtitle};
`
const BodyTextArea = styled.div`
    overflow: auto;
    padding: ${Spacing.margin._8};
    color: ${Colors.text.light};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    ${Typography.bodySmall};
`
const CursorView = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const RecommendationText = styled.span`
    display: flex;
    padding: ${Spacing.margin._12};
    font: inherit;
    cursor: pointer;
    color: ${Colors.text.light};
    text-decoration: none;
    margin-left: ${Spacing.margin._4};
    ${Typography.bodySmall};
`
const DeeplinkText = styled.span`
    display: flex;
    flex-wrap: nowrap;
`
const CursorText = styled.div`
    display: flex;
    overflow: auto;
    font: inherit;
    color: ${Colors.text.light};
    text-decoration: none;
    align-items: center;
    ${Typography.bodySmall};
`
const CursorArea = styled.div`
    align-self: right;
    display: flex;
    flex-direction: row;
`
const ScheduleGapFiller = () => {
    const [recommendationIndex, setRecommendation] = useState(0)
    const { data: event } = useMeetingBanner()
    if (!event) {
        return null
    }
    const eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
    const eventsubTitle = event.subtitle.length > 0 ? event.subtitle : NO_EVENT_TITLE
    const actions = event.actions
    const numEvents = event.events.length
    const link = actions[recommendationIndex].link

    return (
        <FooterView>
            <FooterTextView>
                <FooterHeaderArea>
                    <HeaderText>{eventTitle}</HeaderText>
                    <JoinMeetingButton conferenceCall={event.events[recommendationIndex]?.conference_call} />
                </FooterHeaderArea>
                <BodyTextArea>{eventsubTitle}</BodyTextArea>
                <FooterText>
                    <NoStyleAnchor href={link}>
                        <DeeplinkText>
                            <Icon size="large" source={logos[actions[recommendationIndex].logo]} />
                            <RecommendationText>{actions[recommendationIndex].title}</RecommendationText>
                        </DeeplinkText>
                    </NoStyleAnchor>
                    {numEvents > 1 && (
                        <CursorView>
                            <CursorArea>
                                <CursorPointerDiv
                                    onClick={() => setRecommendation((recommendationIndex - 1) % numEvents)}
                                >
                                    <Icon source={icons.caret_left} size="small" />
                                </CursorPointerDiv>
                                <CursorPointerDiv
                                    onClick={() => setRecommendation((recommendationIndex + 1) % numEvents)}
                                >
                                    <Icon source={icons.caret_right} size="small" />
                                </CursorPointerDiv>
                            </CursorArea>
                            <CursorText>
                                {recommendationIndex + 1} of {numEvents}
                            </CursorText>
                        </CursorView>
                    )}
                </FooterText>
            </FooterTextView>
        </FooterView>
    )
}

export default ScheduleGapFiller
