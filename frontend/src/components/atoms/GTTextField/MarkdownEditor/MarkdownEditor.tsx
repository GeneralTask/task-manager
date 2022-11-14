import { useCallback, useLayoutEffect, useMemo } from 'react'
import { ExtensionPriority, RemirrorEventListenerProps } from '@remirror/core'
import { Remirror, useRemirror } from '@remirror/react'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import * as RemirrorExtensions from 'remirror/extensions'
import tlds from 'tlds'
import { MarkdownEditorProps } from '../types'
import MarkdownEditorInternal from './MarkdownEditorInternal'

const MarkdownEditor = (props: MarkdownEditorProps) => {
    const linkExtension = useMemo(() => {
        const extension = new RemirrorExtensions.LinkExtension({ autoLink: true, autoLinkAllowedTLDs: tlds })
        extension.addHandler('onClick', (_, data) => {
            window.open(data.href, '_blank')
            return true
        })
        return extension
    }, [])

    const { manager, state } = useRemirror({
        extensions: () => [
            new RemirrorExtensions.BlockquoteExtension(),
            new RemirrorExtensions.BoldExtension(),
            new RemirrorExtensions.BulletListExtension({ enableSpine: true }),
            new RemirrorExtensions.CodeBlockExtension({ supportedLanguages: [jsx, typescript] }),
            new RemirrorExtensions.CodeExtension(),
            new RemirrorExtensions.HardBreakExtension(),
            new RemirrorExtensions.HeadingExtension(),
            new RemirrorExtensions.HistoryExtension(),
            new RemirrorExtensions.ItalicExtension(),
            linkExtension,
            new RemirrorExtensions.ListItemExtension({ priority: ExtensionPriority.High, enableCollapsible: true }),
            new RemirrorExtensions.MarkdownExtension({ copyAsMarkdown: false }),
            new RemirrorExtensions.OrderedListExtension(),
            new RemirrorExtensions.PlaceholderExtension({ placeholder: props.placeholder }),
            new RemirrorExtensions.StrikeExtension(),
            new RemirrorExtensions.TableExtension(),
            new RemirrorExtensions.TrailingNodeExtension(),
            new RemirrorExtensions.UnderlineExtension(),
            new RemirrorExtensions.ImageExtension({ enableResizing: true }),
        ],
        content: props.value,
        selection: 'end',
        stringHandler: 'markdown',
    })

    // when the selected task changes, update the content
    useLayoutEffect(() => {
        manager.view.updateState(manager.createState({ content: props.value }))
    }, [props.itemId])

    const onEdit = useCallback(
        ({ helpers }: RemirrorEventListenerProps<Remirror.Extensions>) => {
            const md = helpers.getMarkdown()
            if (md !== props.value) {
                props.onChange(md)
            }
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
