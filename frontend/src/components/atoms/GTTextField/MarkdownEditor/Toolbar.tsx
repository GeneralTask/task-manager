import { useActive, useCommands } from '@remirror/react'
import { CMD_CTRL, CTRL, SHIFT } from '../../../../constants/shortcuts'
import { icons } from '../../../../styles/images'
import ToolbarButton from '../toolbar/ToolbarButton'
import { Divider, MarginLeftGap, MenuContainer } from '../toolbar/styles'

interface ToolbarProps {
    actions?: React.ReactNode | React.ReactNode[]
}
const Toolbar = ({ actions }: ToolbarProps) => {
    const commands = useCommands()
    const active = useActive()

    return (
        <MenuContainer onMouseDown={(e) => e.preventDefault()}>
            <ToolbarButton
                icon={icons.bold}
                action={commands.toggleBold}
                isActive={active.bold()}
                shortcutLabel="Bold"
                shortcut={`${CMD_CTRL.label}+B`}
            />
            <ToolbarButton
                icon={icons.italic}
                action={commands.toggleItalic}
                isActive={active.italic()}
                shortcutLabel="Italic"
                shortcut={`${CMD_CTRL.label}+I`}
            />
            <ToolbarButton
                icon={icons.strikethrough}
                action={commands.toggleStrike}
                isActive={active.strike()}
                shortcutLabel="Strikethrough"
                shortcut={`${CMD_CTRL.label}+D`}
            />
            <Divider />
            {/* TODO: will add this back with full link functionality */}
            {/* <ToolbarButton icon={icons.link} action={emptyFunction} isActive={active.link()} title="Add link" /> */}
            {/* <Divider /> */}
            <ToolbarButton
                icon={icons.list_ol}
                action={commands.toggleOrderedList}
                isActive={active.orderedList()}
                shortcutLabel="Ordered list"
                shortcut={`${CMD_CTRL.label}+${SHIFT}+9`}
            />
            <ToolbarButton
                icon={icons.list_ul}
                action={commands.toggleBulletList}
                isActive={active.bulletList()}
                shortcutLabel="Bulleted list"
                shortcut={`${CMD_CTRL.label}+${SHIFT}+8`}
            />
            <Divider />
            <ToolbarButton
                icon={icons.quote_right}
                action={commands.toggleBlockquote}
                isActive={active.blockquote()}
                shortcutLabel="Blockquote"
                shortcut={`${CTRL.label}+>`}
            />
            <ToolbarButton
                icon={icons.code}
                action={commands.toggleCode}
                isActive={active.code()}
                shortcutLabel="Code"
            />
            <ToolbarButton
                icon={icons.code_block}
                action={commands.toggleCodeBlock}
                isActive={active.codeBlock()}
                shortcutLabel="Code block"
            />
            <MarginLeftGap>{actions}</MarginLeftGap>
        </MenuContainer>
    )
}

export default Toolbar
