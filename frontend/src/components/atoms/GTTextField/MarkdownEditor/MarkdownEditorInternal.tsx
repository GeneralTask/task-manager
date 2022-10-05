import { useEffect } from 'react'
import { EditorComponent, useCommands } from '@remirror/react'
import styled from 'styled-components'
import { Border, Spacing, Typography } from '../../../../styles'
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
`

const MarkdownEditorInternal = (props: MarkdownEditorProps) => {
    const { blur, selectAll } = useCommands()
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
        >
            <EditorContainer>
                <EditorComponent />
            </EditorContainer>
            <RichTextToolbar />
        </EditorAndToolbarContainer>
    )
}

export default MarkdownEditorInternal
