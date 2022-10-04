import { useCommands } from '@remirror/react'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../../../styles'
import { icons } from '../../../../styles/images'
import GTIconButton from '../../buttons/GTIconButton'

const MenuContainer = styled.div`
    display: flex;
    background-color: ${Colors.background.medium};
    padding: ${Spacing._4} ${Spacing._8};
    border-bottom-left-radius: ${Border.radius.small};
    border-bottom-right-radius: ${Border.radius.small};
    gap: ${Spacing._8};
`

const RichTextEditorMenu = () => {
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
            <GTIconButton icon={icons.bold} iconColor="gray" onClick={() => toggleBold()} />
            <GTIconButton icon={icons.italic} iconColor="gray" onClick={() => toggleItalic()} />
            <GTIconButton icon={icons.underline} iconColor="gray" onClick={() => toggleUnderline()} />
            <GTIconButton icon={icons.strikethrough} iconColor="gray" onClick={() => toggleStrike()} />
            {/* divider */}
            <GTIconButton icon={icons.link} iconColor="gray" onClick={() => toggleUnderline()} />
            {/* divider */}
            <GTIconButton icon={icons.list_ol} iconColor="gray" onClick={() => toggleOrderedList()} />
            <GTIconButton icon={icons.list_ul} iconColor="gray" onClick={() => toggleBulletList()} />
            {/* divider */}
            <GTIconButton icon={icons.quote_right} iconColor="gray" onClick={() => toggleBlockquote()} />
            <GTIconButton icon={icons.code} iconColor="gray" onClick={() => toggleCode()} />
            <GTIconButton icon={icons.code_block} iconColor="gray" onClick={() => toggleCodeBlock()} />
        </MenuContainer>
    )
}

export default RichTextEditorMenu
