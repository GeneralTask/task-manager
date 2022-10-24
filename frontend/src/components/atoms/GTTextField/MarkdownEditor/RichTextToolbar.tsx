import { useActive, useCommands } from '@remirror/react'
import styled from 'styled-components'
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
        <MenuContainer>
            <ToolbarButton icon={icons.bold} action={commands.toggleBold} isActive={active.bold()} title="Bold" />
            <ToolbarButton
                icon={icons.italic}
                action={commands.toggleItalic}
                isActive={active.italic()}
                title="Italic"
            />
            <ToolbarButton
                icon={icons.underline}
                action={commands.toggleUnderline}
                isActive={active.underline()}
                title="Underline"
            />
            <ToolbarButton
                icon={icons.strikethrough}
                action={commands.toggleStrike}
                isActive={active.strike()}
                title="Strikethrough"
            />
            <Divider />
            {/* TODO: will add this back with full link functionality */}
            {/* <ToolbarButton icon={icons.link} action={emptyFunction} isActive={active.link()} title="Add link" /> */}
            {/* <Divider /> */}
            <ToolbarButton
                icon={icons.list_ol}
                action={commands.toggleOrderedList}
                isActive={active.orderedList()}
                title="Ordered list"
            />
            <ToolbarButton
                icon={icons.list_ul}
                action={commands.toggleBulletList}
                isActive={active.bulletList()}
                title="Bullet list"
            />
            <Divider />
            <ToolbarButton
                icon={icons.quote_right}
                action={commands.toggleBlockquote}
                isActive={active.blockquote()}
                title="Quote"
            />
            <ToolbarButton icon={icons.code} action={commands.toggleCode} isActive={active.code()} title="Code" />
            <ToolbarButton
                icon={icons.code_block}
                action={commands.toggleCodeBlock}
                isActive={active.codeBlock()}
                title="Code block"
            />
            <MarginLeftGap>{actions}</MarginLeftGap>
        </MenuContainer>
    )
}

export default RichTextToolbar
