import { DateTime } from 'luxon'
import React from 'react'
import SanitizedHTML from '../../atoms/SanitizedHTML'
import { TEmail } from '../../../utils/types'

// styles copied from Gmail email HTML
const blockQuoteStyle = {
    margin: '0px 0px 0px 0.8ex',
    borderLeft: '1px solid rgb(204, 204, 204)',
    paddingLeft: '1ex',
}

interface EmailWithQuotedReplyProps {
    bodyHTML: string
    quotedEmail: TEmail
}
const EmailWithQuotedReply = ({ bodyHTML, quotedEmail }: EmailWithQuotedReplyProps) => {
    const formattedSentAt = DateTime.fromISO(quotedEmail.sent_at).toLocaleString(DateTime.DATETIME_MED)

    return (
        <>
            <SanitizedHTML dirtyHTML={bodyHTML} />
            <br />
            <div>
                <div>
                    On {formattedSentAt} {quotedEmail.sender.name} {'<'}
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
        </>
    )
}

export default EmailWithQuotedReply
