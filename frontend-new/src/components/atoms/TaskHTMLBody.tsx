import React from 'react'
import sanitizeHtml from 'sanitize-html'

interface TaskHTMLBodyProps {
    dirtyHTML: string
}
const TaskHTMLBody = ({ dirtyHTML }: TaskHTMLBodyProps) => {
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
    return <span dangerouslySetInnerHTML={{ __html: cleanHTML }} />
}

export default TaskHTMLBody
