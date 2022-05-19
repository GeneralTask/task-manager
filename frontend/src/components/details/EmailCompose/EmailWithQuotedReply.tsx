import { DateTime } from 'luxon'
import { EmailComposeType } from '../../../utils/enums'
import React from 'react'
import SanitizedHTML from '../../atoms/SanitizedHTML'
import { TEmail } from '../../../utils/types'

// styles copied from Gmail email HTML
const blockQuoteStyle = {
    margin: '0px 0px 0px 0.8ex',
    borderLeft: '1px solid rgb(204, 204, 204)',
    paddingLeft: '1ex',
}

const QuotedReply = ({ quotedEmail }: { quotedEmail: TEmail }) => {
    const formattedSentAt = DateTime.fromISO(quotedEmail.sent_at).toLocaleString(DateTime.DATETIME_MED)
    return (
        <div>
            <div>
                On {formattedSentAt} {quotedEmail.sender.name || quotedEmail.sender.name + ' '}
                {'<'}
                <a href={'mailto:' + quotedEmail.sender.email} target="_blank" rel="noreferrer">
                    {quotedEmail.sender.email}
                </a>
                {'>'} wrote:
                <br />
            </div>
            <blockquote style={blockQuoteStyle}>
                <SanitizedHTML dirtyHTML={quotedEmail.body} />
            </blockquote>
        </div>
    )
}

const ForwardedEmail = ({ forwardedEmail }: { forwardedEmail: TEmail }) => {
    const formattedSentAt = DateTime.fromISO(forwardedEmail.sent_at).toLocaleString(DateTime.DATETIME_MED)
    return (
        <div>
            <div>
                ---------- Forwarded message ---------
                <br />
                On {formattedSentAt} {forwardedEmail.sender.name || forwardedEmail.sender.name + ' '}
                {'<'}
                <a href={'mailto:' + forwardedEmail.sender.email} target="_blank" rel="noreferrer">
                    {forwardedEmail.sender.email}
                </a>
                {'>'} wrote:
                <br />
            </div>
            <blockquote style={blockQuoteStyle}>
                --- old body here ---
                {/* <SanitizedHTML dirtyHTML={forwardedEmail.body} /> */}
            </blockquote>
        </div>
    )
}

interface EmailWithQuotedReplyProps {
    bodyHTML: string
    quotedEmail: TEmail
    composeType: EmailComposeType
}
const EmailWithQuotedReply = ({ bodyHTML, quotedEmail, composeType }: EmailWithQuotedReplyProps) => {
    return (
        <>
            {/* <SanitizedHTML dirtyHTML={bodyHTML} /> */}
            <br />
            {(composeType === EmailComposeType.REPLY || composeType === EmailComposeType.REPLY_ALL) && (
                <QuotedReply quotedEmail={quotedEmail} />
            )}
            {composeType === EmailComposeType.FORWARD && <ForwardedEmail forwardedEmail={quotedEmail} />}
        </>
    )
}

export default EmailWithQuotedReply
