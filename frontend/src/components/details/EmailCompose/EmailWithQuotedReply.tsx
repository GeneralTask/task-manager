import { DateTime } from 'luxon'
import React from 'react'
import SanitizedHTML from '../../atoms/SanitizedHTML'
import { TEmail } from '../../../utils/types'
import styled from 'styled-components'

// styles copied from Gmail email HTML
const BlockQuote = styled.blockquote`
    margin: 0px 0px 0px 0.8ex;
    border-left: 1px solid rgb(204, 204, 204);
    padding-left: 1ex;
`

interface EmailWithQuotedReplyProps {
    bodyHTML: string
    quotedEmail: TEmail
}
const EmailWithQuotedReply = ({ bodyHTML, quotedEmail }: EmailWithQuotedReplyProps) => {
    const formattedSentAt = DateTime.fromISO(quotedEmail.sent_at).toLocaleString(DateTime.DATETIME_MED)

    // structure copied from Gmail email HTML
    return (
        <>
            <div dir="ltr">
                <SanitizedHTML dirtyHTML={bodyHTML} />
            </div>
            <br />
            <div className="gmail_quote">
                <div dir="ltr" className="gmail_attr">
                    On {formattedSentAt} {quotedEmail.sender.name} {'<'}
                    <a href={'mailto:' + quotedEmail.sender.email} target="_blank" rel="noreferrer">
                        {quotedEmail.sender.email}
                    </a>
                    {'>'} wrote:
                    <br />
                </div>
                <BlockQuote className="gmail_quote">
                    <div dir="ltr">
                        <SanitizedHTML dirtyHTML={quotedEmail.body} />
                    </div>
                </BlockQuote>
            </div>
        </>
    )
}

export default EmailWithQuotedReply
