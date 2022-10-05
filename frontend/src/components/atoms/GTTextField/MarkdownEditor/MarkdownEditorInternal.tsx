import { useEffect, useState } from 'react'
import { EditorComponent, useCommands, useSelectedText } from '@remirror/react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
import { FontSize, MarkdownEditorProps } from '../types'
import RichTextToolbar from './RichTextToolbar'

const EditorContainer = styled.div`
    overflow: auto;
    width: 100%;
    height: 100%;
`
const EditorAndToolbarContainer = styled.div<{
    maxHeight?: number
    minHeight?: number
    isFullHeight?: boolean
    fontSize: FontSize
}>`
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    ${({ maxHeight, isFullHeight }) => (maxHeight && !isFullHeight ? `max-height: ${maxHeight}px;` : '')}
    ${({ isFullHeight }) => (isFullHeight ? 'height: 100%;' : '')}
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
    .remirror-editor-wrapper {
        /* subtract the border and padding of the Container in GTTextField */
        padding: ${Spacing._8};
        height: calc(100% - 2 * (${Border.stroke.medium} + ${Spacing._8}));
    }
    .remirror-editor {
        outline: none;
        height: 100%;
        white-space: pre-wrap;
        > * {
            margin-top: 0;
        }
    }
    .language-markup {
        background-color: ${Colors.background.medium};
        border: ${Border.stroke.medium} solid ${Colors.border.light};
        border-radius: ${Border.radius.mini};
        padding: ${Spacing._4};
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
`

const MarkdownEditorInternal = (props: MarkdownEditorProps) => {
    const { blur, selectAll } = useCommands()
    const selectedText = useSelectedText()
    const [isTextSelected, setIsTextSelected] = useState(selectedText !== undefined)

    useEffect(() => {
        setIsTextSelected(selectedText !== undefined)
    }, [selectedText])

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
        <EditorAndToolbarContainer
            onKeyDown={handleKeyDown}
            maxHeight={props.maxHeight}
            isFullHeight={props.isFullHeight}
            fontSize={props.fontSize}
            onBlur={() => setIsTextSelected(false)}
        >
            <EditorContainer>
                <EditorComponent />
            </EditorContainer>
            {isTextSelected && <RichTextToolbar />}
        </EditorAndToolbarContainer>
    )
}

export default MarkdownEditorInternal
