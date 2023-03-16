import { Editor as AtlaskitEditor, EditorActions } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer'
import styled, { css } from 'styled-components'
import useReplaceEditorButtonIcons from '../../../../hooks/useReplaceEditorIcons'
import { Colors, Spacing, Typography } from '../../../../styles'
import { TOOLBAR_HEIGHT } from '../toolbar/styles'
import { RichTextEditorProps } from '../types'
import adf2md from './adfToMd'

const serializer = new JSONTransformer()

const EditorTypographyOverride = css`
    div[aria-label='Floating Toolbar'] {
        ${Typography.deprecated_body};
        color: ${Colors.text.light} !important;
    }
    button[aria-label='Edit link'] {
        ${Typography.deprecated_body};
        display: inline;
        color: ${Colors.text.light} !important;
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
        > :not(.code-block) {
            padding-bottom: ${Spacing._8};
            margin: 0;
        }
        > .code-block {
            margin: 0 0 ${Spacing._8};
            background-color: red;
        }
    }
    [aria-label*='floating controls'] {
        z-index: 1 !important;
    }
    .assistive {
        display: none;
    }
    ${({ isMarkdown }) => isMarkdown && `u { text-decoration: none; } `} /* remove underline if in markdown mode */
    
    /* hide quick insert menu and text coloring */
    [aria-label="Popup"] {
        display: none;
    }
    [aria-label='On quickInsertTypeAhead'],
    [aria-label='On quickInsertTypeAhead'] * {
        color: ${Colors.text.black} !important;
    }
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
        <EditorContainer
            onKeyDown={handleKeyDown}
            isMarkdown={isMarkdown}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
        >
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
                allowHelpDialog={false}
                quickInsert={false}
            />
        </EditorContainer>
    )
}

export default Editor
