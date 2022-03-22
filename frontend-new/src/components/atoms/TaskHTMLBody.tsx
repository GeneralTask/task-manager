import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { ContentState, convertFromHTML, convertToRaw, Editor, EditorState } from 'draft-js'

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
    const [editorState, setEditorState] = React.useState(() => {
        const html2 = html.replace(/(?:\r\n|\r|\n)/g, '<br>')
        const blocksFromHTML = convertFromHTML(html2)
        const state = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
        console.log(JSON.stringify(html2))
        console.log(convertToRaw(state))
        return EditorState.createWithContent(state)
    })

    const onChange = (state: EditorState) => {
        setEditorState(state)
    }

    return <Editor editorState={editorState} onChange={onChange} />
})

export default ContentEditable
