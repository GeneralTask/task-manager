import React, { forwardRef } from 'react'
import styled from 'styled-components'

const ContentEditableDiv = styled.div`
    &:focus {
        outline: none;
    }
`
interface TaskHTMLBodyProps {
    html: string
    onChange: (html: string) => void
    onBlur: () => void
}

const ContentEditable = forwardRef<HTMLDivElement, TaskHTMLBodyProps>(
    ({ html, onChange, onBlur }: TaskHTMLBodyProps, ref) => {
        const test = () => {
            onBlur()
        }
        console.log(html)
        return <ContentEditableDiv ref={ref} onBlur={test} contentEditable dangerouslySetInnerHTML={{ __html: html }} />
    }
)

export default ContentEditable
