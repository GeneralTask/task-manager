import { useEffect, useLayoutEffect } from 'react'
import { EditorComponent, useCommands } from '@remirror/react'
import styled from 'styled-components'
import { Border, Spacing, Typography } from '../../../../styles'
import { FontSize, GTTextFieldProps } from '../types'

const EditorContainer = styled.div<{ maxHeight?: number; isFullHeight?: boolean; fontSize: FontSize }>`
    overflow: auto;
    height: 100%;
    ${({ maxHeight, isFullHeight }) => (maxHeight && !isFullHeight ? `max-height: ${maxHeight}px;` : '')}
    ${({ isFullHeight }) => (isFullHeight ? 'height: 100%;' : '')}
    ${({ fontSize }) => fontSize === 'small' && Typography.bodySmall};
    ${({ fontSize }) => fontSize === 'medium' && Typography.subtitle};
    ${({ fontSize }) => fontSize === 'large' && Typography.title};
    .remirror-editor-wrapper {
        /* subtract the border and padding of the Container in GTTextField */
        height: calc(100% - 2 * (${Border.stroke.medium} + ${Spacing._8}));
    }
    .remirror-editor {
        outline: none;
        height: 100%;
        white-space: pre-wrap;
    }
`

const MarkdownEditorInternal = (props: GTTextFieldProps) => {
    const { setContent, blur, selectAll } = useCommands()

    useEffect(() => {
        if (props.autoSelect) {
            selectAll()
        }
    }, [])
    console.log(props.initialValue)

    useLayoutEffect(() => {
        console.log('initialValue', props.initialValue)
        setContent(props.initialValue)
    }, [props.initialValue])

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === 'Escape' || (props.blurOnEnter && e.key === 'Enter')) {
            blur()
        }
    }

    return (
        <EditorContainer
            onKeyDown={handleKeyDown}
            maxHeight={props.maxHeight}
            isFullHeight={props.isFullHeight}
            fontSize={props.fontSize}
        >
            <EditorComponent />
        </EditorContainer>
    )
}

export default MarkdownEditorInternal
