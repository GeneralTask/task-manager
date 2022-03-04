import React, { useRef } from 'react'
import { useDrag } from 'react-dnd'
import { Platform, Pressable, View, Text, StyleSheet } from 'react-native'
import { Colors, Flex } from '../../styles'
import { Indices, ItemTypes, TTask } from '../../utils/types'
import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'

interface TaskProps {
    task: TTask
    setSheetTaskId: (label: string) => void
}

const Task = ({ task, setSheetTaskId }: TaskProps) => {
    const onPress = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(task.id)
        }
    }

    const isDraggable = true;

    const indicesRef = React.useRef<Indices>()

    const [{ opacity }, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.TASK,
        item: { id: task.id, indicesRef: indicesRef },
        collect: (monitor) => {
            const isDragging = !!monitor.isDragging()
            return { opacity: isDragging ? 0.5 : 1 }
        },
    }))


    return (
        <View style={styles.container} onPress={onPress} ref={drag}>
            <View style={styles.container}>
                {isDraggable && <Domino />}
                <CompleteButton taskId={task.id} isComplete={task.is_done} />
                <Icon style={styles.iconContainer} />
                <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'} >{task.title}</Text>
            </View>
        </View>
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
        width: 20,
        height: 20,
        ...Flex.column,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    title: {
        marginLeft: 9,
        flexShrink: 1,
        flexWrap: 'wrap',
    }
})

export default Task
