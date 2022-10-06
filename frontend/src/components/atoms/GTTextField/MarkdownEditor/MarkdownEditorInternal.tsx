import { useEffect } from 'react'
import { EditorComponent, useCommands } from '@remirror/react'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../../styles'
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
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .remirror-editor {
        outline: none;
        flex: 1;
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
    .remirror-list-item-marker-container {
        display: none;
    }
    a {
        cursor: pointer;
        color: ${Colors.gtColor.primary};
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
