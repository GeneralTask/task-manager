import React from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Flex, Shadows } from '../../styles'
import { TMessage } from '../../utils/types'
import MarkAsTaskButton from '../atoms/buttons/MarkAsTaskButton'
import { Icon } from '../atoms/Icon'

interface MessageProps {
    message: TMessage
    setSheetTaskId: (label: string) => void
}

const Message = ({ message, setSheetTaskId }: MessageProps) => {
    const onPress = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(message.id)
        }
    }

    return (
        <Pressable style={[styles.container, styles.shadow]} onPress={onPress}>
            <MarkAsTaskButton isTask={false} messageId={message.id} />
            <View style={styles.iconContainer}>
                <Icon size="small" />
            </View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
                {message.title}
            </Text>
        </Pressable>
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
    shadow: {
        ...Shadows.small,
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
