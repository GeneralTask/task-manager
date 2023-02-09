import { Editor as AtlaskitEditor, EditorActions } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer'
import styled, { css } from 'styled-components'
import useReplaceEditorButtonIcons from '../../../../hooks/useReplaceEditorIcons'
import { Spacing, Typography } from '../../../../styles'
import { TOOLBAR_HEIGHT } from '../toolbar/styles'
import { RichTextEditorProps } from '../types'
import adf2md from './adfToMd'

const serializer = new JSONTransformer()

const EditorTypographyOverride = css`
    div[aria-label='Floating Toolbar'] {
        ${Typography.body};
    }
`
const EditorContainer = styled.div<{ isMarkdown: boolean }>`
    ${EditorTypographyOverride}
    height: 100%;
    :focus-within {
        height: calc(100% - ${TOOLBAR_HEIGHT});
    }
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
        padding: ${Spacing._8};
        box-sizing: border-box;
        > * {
            margin-bottom: ${Spacing._8};
        }
        > .code-block {
            margin: 0;
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
    useReplaceEditorButtonIcons()

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
                media={{
                    allowMediaSingle: true,
                    allowResizing: true,
                }}
                contentTransformerProvider={isMarkdown ? (schema) => new MarkdownTransformer(schema) : undefined}
            />
        </EditorContainer>
    )
}

export default Editor
