import { useCallback } from 'react'
import { ExtensionPriority, RemirrorEventListenerProps } from '@remirror/core'
import { EditorComponent, Remirror, useRemirror } from '@remirror/react'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import * as RemirrorExtensions from 'remirror/extensions'
import styled from 'styled-components'
import { GTTextFieldProps } from '../types'

const EditorContainer = styled.div<{ maxHeight?: number }>`
    overflow: auto;
    /* height: 100%; */
    ${({ maxHeight }) => (maxHeight ? `max-height: ${maxHeight}px` : '')}
    .remirror-editor {
        /* overflow: hidden;  */
        /* height: 100%;  */
        outline: none;
    }
`

const MarkdownEditor = (props: GTTextFieldProps) => {
    const { manager, state } = useRemirror({
        extensions: () => [
            new RemirrorExtensions.LinkExtension({ autoLink: true }),
            new RemirrorExtensions.BoldExtension(),
            new RemirrorExtensions.StrikeExtension(),
            new RemirrorExtensions.ItalicExtension(),
            new RemirrorExtensions.HeadingExtension(),
            new RemirrorExtensions.BlockquoteExtension(),
            new RemirrorExtensions.BulletListExtension({ enableSpine: true }),
            new RemirrorExtensions.OrderedListExtension(),
            new RemirrorExtensions.ListItemExtension({ priority: ExtensionPriority.High, enableCollapsible: true }),
            new RemirrorExtensions.CodeExtension(),
            new RemirrorExtensions.CodeBlockExtension({ supportedLanguages: [jsx, typescript] }),
            new RemirrorExtensions.TrailingNodeExtension(),
            new RemirrorExtensions.TableExtension(),
            new RemirrorExtensions.MarkdownExtension({ copyAsMarkdown: false }),
            new RemirrorExtensions.HardBreakExtension(),
        ],
        content: props.initialValue,
        selection: 'end',
        stringHandler: 'markdown',
    })

    const onEdit = useCallback(({ helpers }: RemirrorEventListenerProps<Remirror.Extensions>) => {
        props.onChange(helpers.getMarkdown())
    }, [])

    return (
        <Remirror manager={manager} initialContent={state} onChange={onEdit}>
            <EditorContainer maxHeight={props.maxHeight}>
                <EditorComponent />
            </EditorContainer>
        </Remirror>
    )
}

export default MarkdownEditor
