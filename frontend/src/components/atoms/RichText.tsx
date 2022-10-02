import { useCallback } from 'react'
import { ExtensionPriority, RemirrorEventListenerProps } from '@remirror/core'
import { EditorComponent, Remirror, useRemirror } from '@remirror/react'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import * as RemirrorExtensions from 'remirror/extensions'
import { stopKeydownPropogation } from '../../utils/utils'

interface Props {
    value: string
    onChange: (newValue: string) => void
}
const RichText = (props: Props) => {
    const { manager, state } = useRemirror({
        extensions: () => [
            new RemirrorExtensions.LinkExtension({ autoLink: true }),
            new RemirrorExtensions.BoldExtension(),
            new RemirrorExtensions.StrikeExtension(),
            new RemirrorExtensions.ItalicExtension(),
            new RemirrorExtensions.HeadingExtension(),
            new RemirrorExtensions.LinkExtension(),
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
        content: props.value,
        selection: 'end',
        stringHandler: 'markdown',
    })

    const onEdit = useCallback(({ helpers, state }: RemirrorEventListenerProps<Remirror.Extensions>) => {
        props.onChange(helpers.getMarkdown())
    }, [])

    return (
        <div onKeyDown={stopKeydownPropogation}>
            <Remirror manager={manager} initialContent={state} onChange={onEdit}>
                <EditorComponent />
            </Remirror>
        </div>
    )
}

export default RichText
