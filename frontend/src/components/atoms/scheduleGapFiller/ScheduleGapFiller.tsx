import React, { useState } from 'react'
import styled from 'styled-components'
import { NO_EVENT_TITLE } from '../../../constants'
import { Colors, Spacing, Typography } from '../../../styles'
import { useMeetingBanner } from '../../../services/api-query-hooks'
import { icons, logos } from '../../../styles/images'
import { Icon } from '../Icon'
import JoinMeetingButton from '../buttons/JointMeetingButton'
import { CursorPointerDiv } from '../../calendar/CalendarHeader'
import { FlexGrowView } from '../../details/DetailsTemplate'

const FooterView = styled.div`
    position: absolute;
    top: 100%;
    transform: translateY(-100%);
    right: 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: right;
    height: 170px;
    background-color: ${Colors.white};
    width: 100%;
`
const FooterTextView = styled.div`
    display: flex;
    flex-direction: column;
    align-items: space-between;
    justify-content: center;
    flex-shrink: 1;
    margin: ${Spacing.margin._40}px;
    min-width: 0px;
`
const FooterHeaderArea = styled.span`
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-shrink: 1;
    min-width: 0px;
`
const FooterText = styled.span`
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
    justify-content: center;
    margin-top: 10px;
    margin-left: 10px;
    align-content: space-between;
`
const HeaderText = styled.span`
    margin-right: ${Spacing.margin._8}px;
    font-size: ${Typography.medium.fontSize};
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
    padding-left: ${Spacing.padding._4}px;
    border: 2px solid transparent;
`
const BodyTextArea = styled.span`
    overflow: auto;
    padding: ${Spacing.margin._8}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._400};
`
const CursorView = styled.span`
    display: flex;
    flex-direction: column;
`
const RecommendationText = styled.span`
    display: flex;
    overflow: auto;
    padding: ${Spacing.margin._12}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    text-decoration: none;
    margin-left: 4px;
`
const CursorText = styled.span`
    display: flex;
    overflow: auto;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    text-decoration: none;
    margin-left: 30px;
`
const CursorArea = styled.div`
    margin-left: ${Spacing.margin._16}px;
    margin-right: 0px;
    align-self: right;
    display: flex;
    flex-direction: row;
`
const Recommendation = styled.div`
    margin-right: ${Spacing.margin._8}px;
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
    justify-content: center;
`

const ScheduleGapFiller = () => {
    const [recommendation, setRecommendation] = useState(0)
    const { data: event } = useMeetingBanner()
    let eventTitle = ''
    let eventsubTitle = ''
    if (event == undefined) {
        return null
    }
    eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
    eventsubTitle = event.subtitle.length > 0 ? event.subtitle : NO_EVENT_TITLE
    const action = event.actions
    const numEvents = event.events.length

    return numEvents >= 2 ? (
        <FooterView>
            <FooterTextView>
                <FooterHeaderArea>
                    <HeaderText>{eventTitle}</HeaderText>
                    <JoinMeetingButton
                        conferenceCall={event.events[recommendation]?.conference_call}
                    ></JoinMeetingButton>
                </FooterHeaderArea>
                <BodyTextArea>{eventsubTitle}</BodyTextArea>
                <FooterText>
                    <Recommendation>
                        <Icon size="large" source={logos[action[recommendation].logo]}></Icon>
                        <a href={event?.actions[recommendation].link} style={{ textDecoration: 'none' }}>
                            <RecommendationText>{event?.actions[recommendation].title}</RecommendationText>
                        </a>
                    </Recommendation>
                    <FlexGrowView />
                    <CursorView>
                        <CursorArea>
                            <CursorPointerDiv onClick={() => setRecommendation((recommendation - 1) % numEvents)}>
                                <Icon source={icons.caret_left} size="small" />
                            </CursorPointerDiv>
                            <CursorPointerDiv onClick={() => setRecommendation((recommendation + 1) % numEvents)}>
                                <Icon source={icons.caret_right} size="small" />
                            </CursorPointerDiv>
                        </CursorArea>
                        <CursorText>
                            {recommendation + 1} of {numEvents}
                        </CursorText>
                    </CursorView>
                </FooterText>
            </FooterTextView>
        </FooterView>
    ) : (
        <FooterView>
            <FooterTextView>
                <FooterHeaderArea>
                    <HeaderText>{eventTitle}</HeaderText>
                    <JoinMeetingButton conferenceCall={event.events[0]?.conference_call}></JoinMeetingButton>
                </FooterHeaderArea>
                <BodyTextArea>{eventsubTitle}</BodyTextArea>
                <FooterText>
                    <Recommendation>
                        <Icon size="large" source={logos[action[0].logo]}></Icon>
                        <a href={event?.actions[0].link} style={{ textDecoration: 'none' }}>
                            <RecommendationText>{event?.actions[0].title}</RecommendationText>
                        </a>
                    </Recommendation>
                    <FlexGrowView />
                </FooterText>
            </FooterTextView>
        </FooterView>
    )
}

export default ScheduleGapFiller
