import { useEffect } from 'react'
import ReactDOMServer from 'react-dom/server'
import { Editor as AtlaskitEditor, EditorActions } from '@atlaskit/editor-core'
import { JSONTransformer } from '@atlaskit/editor-json-transformer'
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer'
import adf2md from 'adf-to-md'
import styled from 'styled-components'
import { Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import Flex from '../../Flex'
import { Icon } from '../../Icon'
import { TOOLBAR_HEIGHT } from '../toolbar/styles'
import { RichTextEditorProps } from '../types'

const serializer = new JSONTransformer()

const EditorContainer = styled.div<{ isMarkdown: boolean }>`
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

const IconContainer = styled(Flex)`
    height: 100%;
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

    useEffect(() => {
        const RENDERED_TRASH_ICON = ReactDOMServer.renderToStaticMarkup(
            <IconContainer column alignItems="center" justifyContent="center">
                <Icon icon={icons.trash} color="gray" />
            </IconContainer>
        )
        const editorClassName = 'ak-editor-content-area'

        const editorContentAreaElements = document.getElementsByClassName(editorClassName)
        const targetNode = editorContentAreaElements[0]

        const callback: MutationCallback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    const editorTrashButtons = (mutation.target as Element).getElementsByClassName(
                        'css-6gzodm-ButtonBase'
                    )
                    for (const trashButton of editorTrashButtons) {
                        trashButton.innerHTML = RENDERED_TRASH_ICON
                    }
                }
            }
        }

        const observer = new MutationObserver(callback)
        observer.observe(targetNode, { subtree: true, childList: true })

        return () => {
            observer.disconnect()
        }
    }, [])

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
