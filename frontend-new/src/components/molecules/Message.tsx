import { Colors, Flex, Shadows } from '../../styles'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import { Icon } from '../atoms/Icon'
import React from 'react'
import { TMessage } from '../../utils/types'

interface TaskProps {
    message: TMessage
    setSheetTaskId: (label: string) => void
}

const Message = ({ message, setSheetTaskId }: TaskProps) => {
    const onPress = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(message.id)
        }
    }
    return (
        <Pressable style={[styles.container, styles.shadow]} onPress={onPress}>
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
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 5,
        height: 50,
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
