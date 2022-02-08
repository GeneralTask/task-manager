import React from 'react'
import { Editor, EditorState, RichUtils } from 'draft-js'
import styled from 'styled-components'
import Toolbar from './Toolbar'


const EditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 1px solid #E1D7FD;
    box-shadow: 0px 4px 20px rgba(121, 132, 138, 0.06);
    border-radius: 10px;
    width: 100%;
    height: 100%;
    padding: 16px;
`

const EmailEditor = (): JSX.Element => {
    const [editorState, setEditorState] = React.useState(EditorState.createEmpty())

    const onChange = (state: React.SetStateAction<EditorState>) => {
        setEditorState(state)
    }
    const onBoldClick = () => {
        onChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'))
    }
    const onItalicClick = () => {
        onChange(RichUtils.toggleInlineStyle(editorState, 'ITALIC'))
    }
    const onUnderlineClick = () => {
        onChange(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'))
    }
    const onUnorderedBulletClick = () => {
        onChange(RichUtils.toggleBlockType(editorState, 'unordered-list-item'))
    }
    const onOrderedBulletClick = () => {
        onChange(RichUtils.toggleBlockType(editorState, 'ordered-list-item'))
    }
    const handleKeyCommand = (command: string, editorState: EditorState) => {
        const newState = RichUtils.handleKeyCommand(editorState, command)
        if (newState) {
            onChange(newState)
            return 'handled'
        }
        return 'not-handled'
    }
    return <EditorContainer tabIndex={0}>
        <Editor editorState={editorState} onChange={onChange} handleKeyCommand={handleKeyCommand} />
        <Toolbar
            boldEvent={onBoldClick}
            italicEvent={onItalicClick}
            underlineEvent={onUnderlineClick}
            unorderedBulletEvent={onUnorderedBulletClick}
            orderedBulletEvent={onOrderedBulletClick} />
    </EditorContainer>
}

export default EmailEditor
