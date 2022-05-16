// import { DateTime } from 'luxon'
import React from 'react'
import styled from 'styled-components'
import { NO_EVENT_TITLE } from '../../../constants'
import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'
// import { useInterval } from '../../../hooks'
// import { TEvent, TMeetingBanner } from '../../../utils/types'
import { useMeetingBanner } from '../../../services/api-query-hooks'
import { logos } from '../../../styles/images'
import { Icon } from '../Icon'
import JoinMeetingButton from '../buttons/JointMeetingButton'

const FooterView = styled.div`
    position: absolute;
    top: 100%;
    transform: translateY(-100%);
    right: 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: right;
    height: 150px;
    background-color: ${Colors.white};
    width: 100%;
`
const MessageView = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    flex-shrink: 1;
    margin: ${Spacing.margin._12}px;
    min-width: 0px;
`
const MessageText = styled.span`
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    font-weight: ${Typography.weight._500};
    color: ${Colors.gray._600};
    justify-content: center;
`
const HeaderText = styled.span`
    margin-right: ${Spacing.margin._8}px;
    font-size: ${Typography.xLarge.fontSize};
    font-family: Switzer-Variable;
    padding-left: ${Spacing.padding._4}px;
    border: 2px solid transparent;
`
const BodyTextArea = styled.span`
    overflow: auto;
    padding: ${Spacing.margin._8}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
`
const RecommendationText = styled.span`
    display: flex;
    overflow: auto;
    padding: ${Spacing.margin._8}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    text-decoration: none;
`

// const ActionsContainer = styled.div<{ logo: string; title: string; link: string }>`
//     text-overflow: ellipsis;
//     white-space: nowrap;
//     overflow: hidden;
//     font-weight: ${Typography.weight._500};
//     color: ${Colors.gray._700};
// `

const ScheduleGapFiller = () => {
    const { data: event } = useMeetingBanner()
    var eventTitle = ''
    var eventsubTitle = ''
    if (event == undefined) {
        return null
    }
    eventTitle = event.title.length > 0 ? event.title : NO_EVENT_TITLE
    eventsubTitle = event.subtitle.length > 0 ? event.subtitle : NO_EVENT_TITLE
    const action = event.actions

    // const [count, setCount] = useState(0);
    // const doubleIncreaseHandler = () => {
    //     setCount(count + 1);
    // };

    return (
        <FooterView>
            <MessageView>
                <HeaderText>{eventTitle}</HeaderText>
                {/* <JoinMeetingButton conferenceCall={event.conference_call}></JoinMeetingButton> */}
                <BodyTextArea>{eventsubTitle}</BodyTextArea>
                <MessageText>
                    <Icon size="large" source={logos[action[0].logo]}></Icon>
                    <a href={event?.actions[0].link} style={{ textDecoration: 'none' }}>
                        <RecommendationText>{event?.actions[0].title}</RecommendationText>
                    </a>
                </MessageText>
                {/* <button onClick={doubleIncreaseHandler}>
                    Double Increase
                </button> */}
                {/* <p>Count: {count}</p> */}
            </MessageView>
        </FooterView>
    )
}

export default ScheduleGapFiller
