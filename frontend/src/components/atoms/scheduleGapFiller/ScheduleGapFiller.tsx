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
import NoStyleButton from '../buttons/NoStyleButton'

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
    justify-content: space_between;
    margin-top: ${Spacing.margin._12}px;
    margin-left: ${Spacing.margin._12}px;
    align-content: space-between;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`
const HeaderText = styled.span`
    margin-right: ${Spacing.margin._8}px;
    font-size: ${Typography.medium.fontSize};
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
    padding-left: ${Spacing.padding._4}px;
    border: 2px solid transparent;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`
const BodyTextArea = styled.span`
    overflow: auto;
    padding: ${Spacing.margin._8}px;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._400};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`
const CursorView = styled.span`
    display: flex;
    flex-direction: column;
    align-items: center;
`
const RecommendationText = styled.span`
    display: flex;
    padding: ${Spacing.margin._12}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    text-decoration: none;
    margin-left: ${Spacing.margin._4}px;
`
const CursorText = styled.span`
    display: flex;
    overflow: auto;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    text-decoration: none;
`
const CursorArea = styled.span`
    align-self: right;
    display: flex;
    flex-direction: row;
`
const Recommendation = styled.span`
    margin-right: ${Spacing.margin._8}px;
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
    justify-content: center;
`

const ScheduleGapFiller = () => {
    const [recommendationIndex, setRecommendation] = useState(0)
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
    const link = action[recommendationIndex].link

    return numEvents >= 2 ? (
        <FooterView>
            <FooterTextView>
                <FooterHeaderArea>
                    <HeaderText>{eventTitle}</HeaderText>
                    <JoinMeetingButton conferenceCall={event.events[recommendationIndex]?.conference_call} />
                </FooterHeaderArea>
                <BodyTextArea>{eventsubTitle}</BodyTextArea>
                <FooterText>
                    <Recommendation>
                        <NoStyleButton onClick={() => window.open(link)}>
                            <Icon size="large" source={logos[action[recommendationIndex].logo]} />
                        </NoStyleButton>
                        <a href={action[recommendationIndex].link} style={{ textDecoration: 'none' }}>
                            <RecommendationText>{action[recommendationIndex].title}</RecommendationText>
                        </a>
                    </Recommendation>
                    <FlexGrowView />
                    <CursorView>
                        <CursorArea>
                            <CursorPointerDiv onClick={() => setRecommendation((recommendationIndex - 1) % numEvents)}>
                                <Icon source={icons.caret_left} size="small" />
                            </CursorPointerDiv>
                            <CursorPointerDiv onClick={() => setRecommendation((recommendationIndex + 1) % numEvents)}>
                                <Icon source={icons.caret_right} size="small" />
                            </CursorPointerDiv>
                        </CursorArea>
                        <CursorText>
                            {recommendationIndex + 1} of {numEvents}
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
                        <NoStyleButton onClick={() => window.open(link)}>
                            <Icon size="large" source={logos[action[recommendationIndex].logo]} />
                        </NoStyleButton>
                        <a href={action[recommendationIndex].link} style={{ textDecoration: 'none' }}>
                            <RecommendationText>{action[recommendationIndex].title}</RecommendationText>
                        </a>
                    </Recommendation>
                </FooterText>
            </FooterTextView>
        </FooterView>
    )
}

export default ScheduleGapFiller
