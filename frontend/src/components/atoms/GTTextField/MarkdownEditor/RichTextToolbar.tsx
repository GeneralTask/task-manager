import { useCommands } from '@remirror/react'
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
    const {
        toggleBold,
        toggleItalic,
        toggleUnderline,
        toggleStrike,
        toggleOrderedList,
        toggleBulletList,
        toggleBlockquote,
        toggleCode,
        toggleCodeBlock,
    } = useCommands()

    return (
        <MenuContainer>
            <ToolbarButton icon={icons.bold} action={toggleBold} />
            <ToolbarButton icon={icons.italic} action={toggleItalic} />
            <ToolbarButton icon={icons.underline} action={toggleUnderline} />
            <ToolbarButton icon={icons.strikethrough} action={toggleStrike} />
            <Divider />
            <ToolbarButton icon={icons.link} action={emptyFunction} />
            <Divider />
            <ToolbarButton icon={icons.list_ol} action={toggleOrderedList} />
            <ToolbarButton icon={icons.list_ul} action={toggleBulletList} />
            <Divider />
            <ToolbarButton icon={icons.quote_right} action={toggleBlockquote} />
            <ToolbarButton icon={icons.code} action={toggleCode} />
            <ToolbarButton icon={icons.code_block} action={toggleCodeBlock} />
        </MenuContainer>
    )
}

export default RichTextToolbar
