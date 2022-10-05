import { useEffect, useState } from 'react'
import { EditorComponent, useCommands, useSelectedText } from '@remirror/react'
import styled from 'styled-components'
import { Border, Spacing, Typography } from '../../../../styles'
import { FontSize, MarkdownEditorProps } from '../types'
import RichTextToolbar from './RichTextToolbar'

const EditorContainer = styled.div`
    overflow: auto;
    width: 100%;
    flex: 1;
`
const EditorAndToolbarContainer = styled.div<{
    maxHeight?: number
    minHeight?: number
    isFullHeight?: boolean
    fontSize: FontSize
}>`
    display: flex;
    flex-direction: column;
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
    .remirror-list-item-marker-container {
        display: none;
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
