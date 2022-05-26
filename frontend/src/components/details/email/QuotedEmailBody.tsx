import React, { useState } from 'react'
import SanitizedHTML from '../../atoms/SanitizedHTML'
import styled from 'styled-components'
import { TEmail } from '../../../utils/types'
import { Border, Colors, Spacing } from '../../../styles'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'

const QuoteToggle = styled(NoStyleButton)`
    display: flex;
    align-items: center;
    height: 0;
    border-radius: ${Border.radius.regular};
    padding: 8px ${Spacing.padding._4}px;
    background-color: ${Colors.gray._200};
`

// our rules for determining if a node is a quote
// currently supports gmail classNames - will need to be updated
function isQuotedText(node: HTMLElement): boolean {
    return node?.classList?.contains('gmail_quote')
}

const Quote = ({ quotedHTML }: { quotedHTML: string }) => {
    const [showQuotedHTML, setShowQuotedHTML] = useState(false)
    return (
        <>
            <QuoteToggle onClick={() => setShowQuotedHTML(!showQuotedHTML)}>···</QuoteToggle>
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

    const nodes: JSX.Element[] = []
    emailDoc.body.childNodes.forEach((child, index) => {
        const elem = child as HTMLElement
        if (isQuotedText(elem)) {
            nodes.push(<Quote key={index} quotedHTML={elem.outerHTML} />)
        } else {
            nodes.push(<SanitizedHTML key={index} dirtyHTML={elem.outerHTML} />)
        }
    })
    return <>{nodes}</>
}

export default React.memo(
    QuotedEmailBody,
    (prevProps, nextProps) => prevProps.email.message_id === nextProps.email.message_id
)
