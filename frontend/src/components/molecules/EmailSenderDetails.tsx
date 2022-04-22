import { Colors, Spacing, Typography } from '../../styles'
import { TRecipient, TRecipients, TSender } from '../../utils/types'
import styled from 'styled-components'
import React from 'react'
import TooltipWrapper from '../atoms/TooltipWrapper'

const Container = styled.div``
const Row = styled.div`
    display: flex;
    flex-direction: row;
`
const KeyContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-right: ${Spacing.margin._4}px;
    color: ${Colors.gray._600};
`
const ValueContainer = styled.div`
    display: flex;
    flex-direction: row;
`
const Gray = styled.span`
    font-size: ${Typography.xSmall.fontSize};
    color: ${Colors.gray._400};
`
const Underline = styled.span`
    text-decoration: underline;
`

interface RecipientDetailsProps {
    category: string
    recipients: TRecipient[]
}
function RecipientDetails({ category, recipients }: RecipientDetailsProps): JSX.Element {
    return (
        <>
            {recipients.map(({ name, email }, index) => {
                return (
                    <Row key={index}>
                        <KeyContainer>{index === 0 && category}</KeyContainer>
                        <ValueContainer>{name ? `${name} <${email}>` : email}</ValueContainer>
                    </Row>
                )
            })}
        </>
    )
}

interface EmailSenderDetailsProps {
    sender: TSender | string
    recipients: TRecipients
}

const EmailSenderDetails = ({ sender, recipients }: EmailSenderDetailsProps) => {
    const senderName = typeof sender === 'string' ? sender : sender.name
    const senderEmail = typeof sender === 'string' ? undefined : sender.email
    const numRecipients = recipients.to.length + recipients.cc.length + recipients.bcc.length
    const textDisplay = (
        <Gray>
            <Underline>{`${numRecipients} ${numRecipients === 1 ? 'recipient' : 'recipients'}`}</Underline> ▼
        </Gray>
    )

    const details = (
        <>
            <Row>
                <KeyContainer>From:</KeyContainer>
                <ValueContainer>{senderEmail ? `${senderName} <${senderEmail}>` : senderName}</ValueContainer>
            </Row>
            <RecipientDetails category="To:" recipients={recipients.to} />
            <RecipientDetails category="Cc:" recipients={recipients.cc} />
            <RecipientDetails category="Bcc:" recipients={recipients.bcc} />
        </>
    )

    return (
        <TooltipWrapper dataTip={details} tooltipId="tooltip">
            <Container>{textDisplay}</Container>
        </TooltipWrapper>
    )
}

export default EmailSenderDetails
