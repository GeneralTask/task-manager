import React, { Ref, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Flex, Shadows } from '../../styles'
import { Indices, ItemTypes, TMessage } from '../../utils/types'
import MarkAsTaskButton from '../atoms/buttons/MarkAsTaskButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'

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

    const isDraggable = true

    const indicesRef = useRef<Indices>()

    const [, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.TASK,
        item: { id: message.id, indicesRef: indicesRef },
        collect: (monitor) => {
            const isDragging = !!monitor.isDragging()
            return { opacity: isDragging ? 0.5 : 1 }
        },
    }))

    const dragPreviewRef = Platform.OS === 'web' ? (dragPreview as Ref<View>) : undefined
    const dragRef = Platform.OS === 'web' ? (drag as Ref<View>) : undefined

    return (
        <Pressable style={[styles.container, styles.shadow]} onPress={onPress} ref={dragPreviewRef}>
            {Platform.OS === 'web' && isDraggable && <Domino ref={dragRef} />}
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
