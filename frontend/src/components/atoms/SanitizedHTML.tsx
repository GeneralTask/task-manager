import React from 'react'
import sanitizeHtml from 'sanitize-html'
import styled from 'styled-components'

const SanitizedHTMLContainer = styled.div`
    width: 100%;
    overflow: auto;
`

interface SanitizedHTMLDivProps {
    dirtyHTML: string
}
const SanitizedHTML = ({ dirtyHTML }: SanitizedHTMLDivProps) => {
    const whitelistedHTMLAttributes: sanitizeHtml.IOptions = {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'a', 'center']),
    }
    const transformTags = {
        a: sanitizeHtml.simpleTransform('a', { target: '_blank' }, true),
    }
    const cleanHTML = sanitizeHtml(dirtyHTML, {
        ...whitelistedHTMLAttributes,
        transformTags,
    })
    return <SanitizedHTMLContainer dangerouslySetInnerHTML={{ __html: cleanHTML }} />
}

export default SanitizedHTML
