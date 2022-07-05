import React, { forwardRef } from 'react'
import { TSlackMessageParams } from '../../../utils/types'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { DateTime } from 'luxon'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'

const MessageContainer = styled.div`
    /* border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.large}; */
    padding: ${Spacing.padding._8};
`
const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._8};
    padding: ${Spacing.padding._4};
`
const BodyContainer = styled.div`
    padding: ${Spacing.padding._4};
`
const BlackText = styled.span`
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    color: ${Colors.gray._700};
`
const GrayText = styled(BlackText)`
    color: ${Colors.gray._400};
`

const DividerView = styled.div`
    height: 1px;
    background-color: ${Colors.gray._300};
    margin: ${Spacing.margin._8};
`

interface SlackMessageProps {
    slack_message_params: TSlackMessageParams
}

const SlackMessage = forwardRef<HTMLDivElement, SlackMessageProps>(
    ({ slack_message_params }: SlackMessageProps, ref) => {
        const dateSent = DateTime.fromMillis(slack_message_params.message.ts * 1000)

        const channel =
            slack_message_params.channel.name === 'directmessage'
                ? 'Direct Message'
                : `#${slack_message_params.channel.name}`
        return (
            <>
                <DividerView />
                <MessageContainer ref={ref}>
                    <TopContainer>
                        <BlackText>{`${slack_message_params.message.user} (${channel})`}</BlackText>
                        <GrayText>{getHumanTimeSinceDateTime(dateSent)}</GrayText>
                    </TopContainer>
                    <BodyContainer>
                        <GrayText>{slack_message_params.message.text}</GrayText>
                    </BodyContainer>
                </MessageContainer>
            </>
        )
    }
)

export default SlackMessage
