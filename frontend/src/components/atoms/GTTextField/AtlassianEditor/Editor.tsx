import { Editor as AtlaskitEditor, EditorActions } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer'
import adf2md from 'adf-to-md'
import styled from 'styled-components'
import { Spacing } from '../../../../styles'
import { RichTextEditorProps } from '../types'

const serializer = new JSONTransformer()

const EditorContainer = styled.div<{ isMarkdown: boolean }>`
    flex: 1;
    padding: ${Spacing._8} ${Spacing._8} 0;
    box-sizing: border-box;
    /* height: 100%s needed to make editor match container height so entire area is clickable */
    > div > :nth-child(2) {
        height: 100%;
        > div {
            height: 100%;
        }
    }
    .ak-editor-content-area {
        height: 100%;
    }
    && .ProseMirror {
        height: 100%;
        > * {
            margin: ${Spacing._8} 0;
        }
    }
    .assistive {
        display: none;
    }
    ${({ isMarkdown }) => isMarkdown && `u { text-decoration: none; } `}/* remove underline if in markdown mode */
`

interface EditorProps extends RichTextEditorProps {
    editorActions: EditorActions
}

const Editor = ({
    type,
    value,
    placeholder,
    disabled,
    autoFocus,
    enterBehavior,
    onChange,
    editorActions,
}: EditorProps) => {
    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === 'Escape' || (enterBehavior === 'blur' && e.key === 'Enter')) {
            editorActions.blur()
        }
    }
    const isMarkdown = type === 'markdown'

    return (
        <EditorContainer onKeyDown={handleKeyDown} isMarkdown={isMarkdown}>
            <AtlaskitEditor
                defaultValue={value}
                placeholder={placeholder}
                disabled={disabled}
                shouldFocus={autoFocus}
                appearance="chromeless"
                onChange={(e) => {
                    const json = serializer.encode(e.state.doc)
                    if (isMarkdown) {
                        onChange(adf2md.convert(json).result)
                    } else {
                        onChange(JSON.stringify(json))
                    }
                }}
                contentTransformerProvider={isMarkdown ? (schema) => new MarkdownTransformer(schema) : undefined}
            />
        </EditorContainer>
    )
}

export default Editor
