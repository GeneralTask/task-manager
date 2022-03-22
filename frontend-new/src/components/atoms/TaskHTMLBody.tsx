import React, { forwardRef } from 'react'
import styled from 'styled-components'

const ContentEditableDiv = styled.div`
    white-space: pre-line;
    &:focus {
        outline: none;
    }
`
interface TaskHTMLBodyProps {
    html: string
    onBlur: () => void
}

const ContentEditable = forwardRef<HTMLDivElement, TaskHTMLBodyProps>(({ html, onBlur }: TaskHTMLBodyProps, ref) => {
    return <ContentEditableDiv ref={ref} onBlur={onBlur} contentEditable dangerouslySetInnerHTML={{ __html: html }} />
})

export default ContentEditable
