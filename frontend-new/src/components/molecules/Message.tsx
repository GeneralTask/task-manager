import React, { Ref, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Flex } from '../../styles'
import { Indices, ItemTypes, TMessage } from '../../utils/types'
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

    const dragPreviewRef = Platform.OS === 'web' ? dragPreview as Ref<View> : undefined
    const dragRef = Platform.OS === 'web' ? drag as Ref<View> : undefined

    return (
        <Pressable style={styles.container} onPress={onPress} ref={dragPreviewRef}>
            <View style={styles.container}>
                {Platform.OS === 'web' && isDraggable && <Domino ref={dragRef} />}
                {/* <CompleteButton taskId={task.id} isComplete={task.is_done} /> */}
                {/* TODO: ADD MARK AS TASK BUTTON */}
                <View style={styles.iconContainer}>
                    <Icon size="small" />
                </View>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'} >{message.title}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingTop: 5,
        paddingBottom: 5,
    },
    iconContainer: {
        marginLeft: 6,
    },
    title: {
        marginLeft: 9,
        flexShrink: 1,
        flexWrap: 'wrap',
    }
})

export default Message
