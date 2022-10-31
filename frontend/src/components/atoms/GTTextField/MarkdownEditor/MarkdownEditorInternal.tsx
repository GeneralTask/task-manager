import { useEffect, useRef, useState } from 'react'
import { useCommands, useRemirrorContext } from '@remirror/react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { FontSize, MarkdownEditorProps } from '../types'
import RichTextToolbar from './RichTextToolbar'

const EditorContainer = styled.div`
    overflow: auto;
    width: 100%;
    flex: 1;
`
const EditorAndToolbarContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
`
const Editor = styled.div<{
    fontSize: FontSize
    maxHeight?: number
    minHeight?: number
    isFullHeight?: boolean
}>`
    /* subtract the border and padding of the Container in GTTextField */
    height: calc(100% - 2 * (${Border.stroke.medium} + ${Spacing._8}));
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: ${Spacing._8};
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
    ${({ maxHeight, isFullHeight }) => (maxHeight && !isFullHeight ? `max-height: ${maxHeight}px;` : '')}
    ${({ isFullHeight }) => (isFullHeight ? 'height: 100%;' : '')}
    :focus-within {
        padding-bottom: 0;
    }
    .remirror-editor {
        outline: none;
        flex: 1;
        white-space: pre-wrap;
    }
    .language-markup {
        background-color: ${Colors.background.medium};
        border: ${Border.stroke.medium} solid ${Colors.border.light};
        border-radius: ${Border.radius.mini};
        padding: ${Spacing._4};
        white-space: pre-wrap;
    }
    p > code {
        background-color: ${Colors.background.medium};
        border: ${Border.stroke.medium} solid ${Colors.border.light};
        border-radius: ${Border.radius.mini};
        padding: 0 ${Spacing._4};
    }
    blockquote {
        border-left: ${Spacing._4} solid ${Colors.border.light};
        margin-left: ${Spacing._12};
        padding-left: ${Spacing._8};
    }
    .remirror-list-item-marker-container {
        display: none;
    }
    .remirror-is-empty:first-of-type::before {
        position: absolute;
        color: ${Colors.text.placeholder};
        pointer-events: none;
        content: attr(data-placeholder);
    }
    a {
        cursor: pointer;
        color: ${Colors.gtColor.primary};
    }
    * {
        margin: 0;
    }
`

const MarkdownEditorInternal = (props: MarkdownEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const { blur, selectAll } = useCommands()
    const { getRootProps } = useRemirrorContext({ autoUpdate: true })
    const [isEditorFocused, setIsEditorFocused] = useState(false)

    useEffect(() => {
        if (props.autoSelect) {
            selectAll()
        }
    }, [props.autoSelect])

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === 'Escape' || (props.blurOnEnter && e.key === 'Enter')) {
            blur()
        }
    }

    return (
        <EditorAndToolbarContainer>
            <EditorContainer>
                <Editor
                    {...getRootProps({ ref: editorRef })}
                    onFocus={() => setIsEditorFocused(true)}
                    onBlur={() => setIsEditorFocused(false)}
                    onKeyDown={handleKeyDown}
                    maxHeight={props.maxHeight}
                    isFullHeight={props.isFullHeight}
                    fontSize={props.fontSize}
                />
            </EditorContainer>
            {!props.readOnly && isEditorFocused && <RichTextToolbar actions={props.actions} />}
        </EditorAndToolbarContainer>
    )
}

export default MarkdownEditorInternal
