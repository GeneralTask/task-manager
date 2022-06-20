import { Colors, Spacing, Typography } from '../../styles'
import { TRecipient, TRecipients, TSender } from '../../utils/types'
import styled from 'styled-components'
import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import TooltipWrapper from '../atoms/TooltipWrapper'

const Row = styled.div`
    display: flex;
    flex-direction: row;
`
const KeyContainer = styled.div`
    margin-right: ${Spacing.margin._4};
    color: ${Colors.gray._600};
`
const ValueContainer = styled.div`
    color: ${Colors.gray._800};
`
const SmallGrayText = styled.span`
    font-size: ${Typography.xSmall.fontSize};
    color: ${Colors.gray._400};
`
const Underline = styled.span`
    text-decoration: underline;
`

// Temporary hack to remove bad recipients from backend email recipient parsing
const removeBadRecipients = (recipients: TRecipient[]) => recipients.filter((r) => !r.email.includes('"'))

interface RecipientDetailsProps {
    category: string
    recipients: TRecipient[]
}
const RecipientDetails = ({ category, recipients }: RecipientDetailsProps) => (
    <>
        {recipients.map(({ name, email }, index) => (
            <Row key={index}>
                <KeyContainer>{index === 0 && category}</KeyContainer>
                <ValueContainer>{name ? `${name} <${email}>` : email}</ValueContainer>
            </Row>
        ))}
    </>
)

interface EmailSenderDetailsProps {
    sender: TSender
    recipients: TRecipients
}

const EmailSenderDetails = ({ sender, recipients }: EmailSenderDetailsProps) => {
    const allRecipients = removeBadRecipients([...recipients.to, ...recipients.cc, ...recipients.bcc])
    const numRecipients = allRecipients.length

    const details = ReactDOMServer.renderToString(
        <>
            <Row>
                <KeyContainer>From:</KeyContainer>
                <ValueContainer>{`${sender.name} <${sender.email}>`}</ValueContainer>
            </Row>
            <RecipientDetails category="To:" recipients={removeBadRecipients(recipients.to)} />
            <RecipientDetails category="Cc:" recipients={removeBadRecipients(recipients.cc)} />
            <RecipientDetails category="Bcc:" recipients={removeBadRecipients(recipients.bcc)} />
        </>
    )

    const displayText =
        allRecipients
            .slice(0, 3)
            .map((r) => r.name || r.email)
            .join(', ') + (numRecipients > 3 ? `, +${numRecipients - 3} more` : '')

    return (
        <TooltipWrapper dataTip={details} tooltipId="tooltip">
            <SmallGrayText>
                <Underline>{`To: ${displayText}`}</Underline>
            </SmallGrayText>
        </TooltipWrapper>
    )
}

export default EmailSenderDetails
