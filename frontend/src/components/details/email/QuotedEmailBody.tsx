import React, { useState } from 'react'
import SanitizedHTML from '../../atoms/SanitizedHTML'
import styled from 'styled-components'
import { TEmail } from '../../../utils/types'
import { Border, Colors, Spacing } from '../../../styles'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'

const QuoteToggle = styled(NoStyleButton)`
    display: flex;
    align-items: center;
    border-radius: ${Border.radius.regular};
    padding: 0 ${Spacing.padding._8};
    background-color: ${Colors.gray._200};
`

// our rules for determining if a node is a quote
// currently supports gmail classNames - will need to be updated
function isQuotedText(node: HTMLElement): boolean {
    return node.classList?.contains('gmail_quote')
}

const Quote = ({ quotedHTML }: { quotedHTML: string }) => {
    const [showQuotedHTML, setShowQuotedHTML] = useState(false)
    return (
        <>
            <QuoteToggle onClick={() => setShowQuotedHTML(!showQuotedHTML)}>•••</QuoteToggle>
            {showQuotedHTML && <SanitizedHTML dirtyHTML={quotedHTML} />}
        </>
    )
}

interface QuotedEmailBodyProps {
    email: TEmail
}
const QuotedEmailBody = ({ email }: QuotedEmailBodyProps) => {
    const emailDoc = new DOMParser().parseFromString(email.body, 'text/html')
    if (!emailDoc.body?.childNodes) {
        return <SanitizedHTML dirtyHTML={email.body} />
    }

    const elements = Array.from(emailDoc.body.childNodes).map((child, index) => {
        const elem = child as HTMLElement
        if (isQuotedText(elem)) {
            return <Quote key={index} quotedHTML={elem.outerHTML} />
        } else {
            return <SanitizedHTML key={index} dirtyHTML={elem.outerHTML} />
        }
    })
    return <>{elements}</>
}

export default React.memo(
    QuotedEmailBody,
    (prevProps, nextProps) => prevProps.email.message_id === nextProps.email.message_id
)
