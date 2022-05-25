import { EmailComposeType } from '../../../../utils/enums'
import React from 'react'
import SanitizedHTML from '../../../atoms/SanitizedHTML'
import { TEmail } from '../../../../utils/types'
import { formatSentAtDateTime } from './emailComposeUtils'

// styles copied from Gmail email HTML
const blockQuoteStyle = {
    margin: '0px 0px 0px 0.8ex',
    borderLeft: '1px solid rgb(204, 204, 204)',
    paddingLeft: '1ex',
}

interface QuotedEmailProps {
    email: TEmail
}
const QuotedReply = ({ email }: QuotedEmailProps) => {
    const formattedSentAt = formatSentAtDateTime(email.sent_at)
    return (
        <div>
            <div>
                On {formattedSentAt} {email.sender.name || email.sender.name + ' '}
                {'<'}
                <a href={'mailto:' + email.sender.email} target="_blank" rel="noreferrer">
                    {email.sender.email}
                </a>
                {'>'} wrote:
                <br />
            </div>
            <blockquote style={blockQuoteStyle}>
                <SanitizedHTML dirtyHTML={email.body} />
            </blockquote>
        </div>
    )
}

const QuotedForward = ({ email }: QuotedEmailProps) => {
    const formattedSentAt = formatSentAtDateTime(email.sent_at)
    return (
        <div>
            <div>
                <div dir="ltr">
                    ---------- Forwarded message ---------
                    <br />
                    From: <strong dir="auto">{email.sender.name || email.sender.email}</strong>{' '}
                    <span dir="auto">
                        {'<'}
                        {email.sender.email}
                        {'>'}
                    </span>
                    <br />
                    Date: {formattedSentAt}
                    <br />
                    Subject: {email.subject}
                    <br />
                    To: {'<'}
                    <a href={'mailto:' + email.sender.email} target="_blank" rel="noreferrer">
                        {email.sender.email}
                    </a>
                    {'>'}
                    <br />
                </div>
            </div>
            <br />
            <br />
            <SanitizedHTML dirtyHTML={email.body} />
        </div>
    )
}

interface EmailWithQuoteProps {
    bodyHTML: string
    quotedEmail: TEmail
    composeType: EmailComposeType
}
const EmailWithQuote = ({ bodyHTML, quotedEmail, composeType }: EmailWithQuoteProps) => {
    return (
        <>
            <SanitizedHTML dirtyHTML={bodyHTML} />
            <br />
            {(composeType === EmailComposeType.REPLY || composeType === EmailComposeType.REPLY_ALL) && (
                <QuotedReply email={quotedEmail} />
            )}
            {composeType === EmailComposeType.FORWARD && <QuotedForward email={quotedEmail} />}
        </>
    )
}

export default EmailWithQuote
