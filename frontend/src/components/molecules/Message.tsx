import { Colors, Flex } from '../../styles'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useNavigate, useParams } from 'react-router-dom'

import { Icon } from '../atoms/Icon'
import { useKeyboardShortcut } from '../atoms/KeyboardShortcuts'
import ItemContainer from './ItemContainer'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import MarkAsTaskButton from '../atoms/buttons/MarkAsTaskButton'
import React from 'react'
import { TMessage } from '../../utils/types'
import { logos } from '../../styles/images'
import { useAppSelector } from '../../redux/hooks'

interface MessageProps {
    message: TMessage
    setSheetTaskId: (label: string) => void
}
const Message = ({ message, setSheetTaskId }: MessageProps) => {
    const navigate = useNavigate()
    const params = useParams()

    const isExpanded = params.message === message.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === message.id)

    const hideDetailsView = () => navigate(`/messages/`)

    const onClick = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(message.id)
        }
        if (params.message === message.id) {
            hideDetailsView()
        } else {
            navigate(`/messages/${message.id}`)
        }
    }
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.CLOSE, hideDetailsView, !isExpanded)
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClick, !isSelected)

    return (
        <ItemContainer isSelected={isSelected} onClick={onClick} >
            <MarkAsTaskButton isTask={false} messageId={message.id} />
            <View style={styles.iconContainer}>
                <Icon source={logos[message.source.logo_v2]} size="small" />
            </View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
                {message.title}
            </Text>
        </ItemContainer>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 4,
        paddingHorizontal: 8,
        height: 34,
    },
    iconContainer: {
        marginLeft: 6,
    },
    title: {
        marginLeft: 9,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
})

export default Message
