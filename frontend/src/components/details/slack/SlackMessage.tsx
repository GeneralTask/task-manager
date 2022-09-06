import React from 'react'
import { TSlackMessageParams } from '../../../utils/types'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { DateTime } from 'luxon'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'
import { Divider } from '../../atoms/SectionDivider'
import { MESSAGE_TYPE_DM } from '../../../constants'

const MessageContainer = styled.div`
    padding: ${Spacing.extraSmall};
`
const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.extraSmall};
    padding: ${Spacing.mini};
`
const BodyContainer = styled.div`
    padding: ${Spacing.mini};
`
const BlackText = styled.span`
    color: ${Colors.text.black};
    ${Typography.bodySmall};
`
const GrayText = styled(BlackText)`
    color: ${Colors.text.light};
`

const DividerContainer = styled.div`
    margin: ${Spacing.extraSmall} 0;
`

interface SlackMessageProps {
    sender: string
    slack_message_params: TSlackMessageParams
}

const SlackMessage = ({ sender, slack_message_params }: SlackMessageProps) => {
    const dateSent = DateTime.fromMillis(slack_message_params.message.ts * 1000)

    const channel =
        slack_message_params.channel.name === MESSAGE_TYPE_DM
            ? 'Direct Message'
            : `#${slack_message_params.channel.name}`
    return (
        <>
            <DividerContainer>
                <Divider color={Colors.background.dark} />
            </DividerContainer>
            <MessageContainer>
                <TopContainer>
                    <BlackText>{`${sender} (${channel})`}</BlackText>
                    <GrayText>{getHumanTimeSinceDateTime(dateSent)}</GrayText>
                </TopContainer>
                <BodyContainer>
                    <GrayText>{slack_message_params.message.text}</GrayText>
                </BodyContainer>
            </MessageContainer>
        </>
    )
}

export default SlackMessage
