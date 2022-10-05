import { useActive, useCommands } from '@remirror/react'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import { emptyFunction } from '../../../../utils/utils'
import ToolbarButton from './ToolbarButton'

const MenuContainer = styled.div`
    display: flex;
    align-items: center;
    background-color: ${Colors.background.medium};
    padding: ${Spacing._4} ${Spacing._8};
    border-bottom-left-radius: ${Border.radius.small};
    border-bottom-right-radius: ${Border.radius.small};
    gap: ${Spacing._8};
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
`
const Divider = styled.div`
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    height: ${Spacing._16};
`

const RichTextToolbar = () => {
    const commands = useCommands()

    const active = useActive()

    return (
        <MenuContainer>
            <ToolbarButton icon={icons.bold} action={commands.toggleBold} isActive={active.bold()} />
            <ToolbarButton icon={icons.italic} action={commands.toggleItalic} isActive={active.italic()} />
            <ToolbarButton icon={icons.underline} action={commands.toggleUnderline} isActive={active.underline()} />
            <ToolbarButton icon={icons.strikethrough} action={commands.toggleStrike} isActive={active.strike()} />
            <Divider />
            <ToolbarButton icon={icons.link} action={emptyFunction} isActive={active.link()} />
            <Divider />
            <ToolbarButton icon={icons.list_ol} action={commands.toggleOrderedList} isActive={active.orderedList()} />
            <ToolbarButton icon={icons.list_ul} action={commands.toggleBulletList} isActive={active.bulletList()} />
            <Divider />
            <ToolbarButton icon={icons.quote_right} action={commands.toggleBlockquote} isActive={active.blockquote()} />
            <ToolbarButton icon={icons.code} action={commands.toggleCode} isActive={active.code()} />
            <ToolbarButton icon={icons.code_block} action={commands.toggleCodeBlock} isActive={active.codeBlock()} />
        </MenuContainer>
    )
}

export default RichTextToolbar
