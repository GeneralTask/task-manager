import { useCallback } from 'react'
import { ExtensionPriority, RemirrorEventListenerProps } from '@remirror/core'
import { Remirror, useRemirror } from '@remirror/react'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import * as RemirrorExtensions from 'remirror/extensions'
import { GTTextFieldProps } from '../types'
import MarkdownEditorInternal from './MarkdownEditorInternal'

const MarkdownEditor = (props: GTTextFieldProps) => {
    const { manager, state } = useRemirror({
        extensions: () => [
            new RemirrorExtensions.PlaceholderExtension({ placeholder: props.placeholder }),
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
            new RemirrorExtensions.HistoryExtension(),
        ],
        content: props.initialValue,
        selection: 'end',
        stringHandler: 'markdown',
    })

    const onEdit = useCallback(
        ({ helpers }: RemirrorEventListenerProps<Remirror.Extensions>) => {
            props.onChange(helpers.getMarkdown())
        },
        [props.onChange]
    )

    return (
        <Remirror
            manager={manager}
            initialContent={state}
            onChange={onEdit}
            autoFocus={props.autoFocus}
            editable={!props.disabled}
        >
            <MarkdownEditorInternal {...props} />
        </Remirror>
    )
}

export default MarkdownEditor
