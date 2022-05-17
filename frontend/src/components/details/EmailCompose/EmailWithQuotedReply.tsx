import React from 'react'
import styled from 'styled-components'
import { TEmail } from '../../../utils/types'
import SanitizedHTML from '../../atoms/SanitizedHTML'
import { DateTime } from 'luxon'

const BlockQuote = styled.blockquote`
    margin: 0px 0px 0px 0.8ex;
    border-left: 1px solid rgb(204, 204, 204);
    padding-left: 1ex;
`
// Mon, May 16, 2022 at 3:46 PM
interface EmailComposeQuotedReplyProps {
    bodyHTML?: string
    quotedEmail: TEmail
}
const EmailComposeQuotedReply = ({ quotedEmail }: EmailComposeQuotedReplyProps) => {
    const formattedSentAt = DateTime.fromISO(quotedEmail.sent_at).toLocaleString(DateTime.DATETIME_MED)

    return (
        <div className="gmail_quote">
            <div dir="ltr" className="gmail_attr">
                On {formattedSentAt} {quotedEmail.sender.name} &lt;
                <a href={'mailto:' + quotedEmail.sender.email} target="_blank" rel="noreferrer">
                    {quotedEmail.sender.email}
                </a>
                &gt; wrote:
                <br />
            </div>
            <BlockQuote className="gmail_quote">
                <div dir="ltr">
                    <SanitizedHTML dirtyHTML={quotedEmail.body} />
                </div>
            </BlockQuote>
        </div>
    )
}

export default EmailComposeQuotedReply
