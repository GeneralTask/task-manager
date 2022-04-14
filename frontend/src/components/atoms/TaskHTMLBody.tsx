import React from 'react'
import sanitizeHtml from 'sanitize-html'

interface HTMLBodyProps {
    dirtyHTML: string
}

export const TaskHTMLBody = ({ dirtyHTML }: HTMLBodyProps) => {
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
    return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
}

export const removeHTMLTags = (dirtyHTML: string) => {
    const cleanHTML = sanitizeHtml(dirtyHTML, {
        allowedTags: [],
        allowedAttributes: {},
    })
    return cleanHTML
}
