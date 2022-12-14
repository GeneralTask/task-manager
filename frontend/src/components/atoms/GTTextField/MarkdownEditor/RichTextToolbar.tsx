import { useActive, useCommands } from '@remirror/react'
import styled from 'styled-components'
import { CMD_CTRL, CTRL, SHIFT } from '../../../../constants/shortcuts'
import { Border, Colors, Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import ToolbarButton from './ToolbarButton'

const MenuContainer = styled.div`
    display: flex;
    align-items: center;
    background-color: ${Colors.background.medium};
    padding: ${Spacing._4} ${Spacing._8};
    border-bottom-left-radius: ${Border.radius.small};
    border-bottom-right-radius: ${Border.radius.small};
    gap: ${Spacing._8};
    bottom: 0;
    left: 0;
    right: 0;
    overflow-x: auto;
`
const Divider = styled.div`
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    height: ${Spacing._16};
`
const MarginLeftGap = styled.div`
    margin-left: auto !important;
    gap: ${Spacing._8};
`

interface RichTextToolbarProps {
    actions?: React.ReactNode | React.ReactNode[]
}
const RichTextToolbar = ({ actions }: RichTextToolbarProps) => {
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
                icon={icons.underline}
                action={commands.toggleUnderline}
                isActive={active.underline()}
                shortcutLabel="Underline"
                shortcut={`${CMD_CTRL.label}+U`}
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

export default RichTextToolbar
