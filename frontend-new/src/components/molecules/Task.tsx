import { Colors, Flex } from '../../styles'
import { logos } from '../../styles/images'
import { Indices, ItemTypes, TTask } from '../../utils/types'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { Ref, useRef } from 'react'

import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import TaskDropContainer from './TaskDropContainer'
import { useDrag } from 'react-dnd'
import { useNavigate, useParams } from 'react-router-dom'

interface TaskProps {
    task: TTask
    setSheetTaskId: (label: string) => void
    dragDisabled: boolean
    index: number
}

const Task = ({ task, setSheetTaskId }: TaskProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const indicesRef = useRef<Indices>()
    const isDraggable = true
    const onPress = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(task.id)
        }
        if (params.task === task.id) {
            navigate(`/tasks/${params.section}`)
        }
        else {
            navigate(`/tasks/${params.section}/${task.id}`)
        }
    }

    const [, drag, dragPreview] = useDrag(() => ({
        type: ItemTypes.TASK,
        item: { id: task.id, indicesRef: indicesRef },
        collect: (monitor) => {
            const isDragging = !!monitor.isDragging()
            return { opacity: isDragging ? 0.5 : 1 }
        },
    }))

    const dragPreviewRef = Platform.OS === 'web' ? dragPreview as Ref<View> : undefined
    const dragRef = Platform.OS === 'web' ? drag as Ref<View> : undefined

    console.log('render')

    return (
        <TaskDropContainer task={task}>
            <Pressable style={styles.container} onPress={onPress} ref={dragPreviewRef}>
                <View style={styles.container}>
                    {Platform.OS === 'web' && isDraggable && <Domino ref={dragRef} />}
                    <CompleteButton taskId={task.id} isComplete={task.is_done} />
                    <View style={styles.iconContainer}>
                        <Icon source={logos[task.source.logo_v2]} size="small" />
                    </View>
                    <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'} >{task.title}</Text>
                </View>
            </Pressable>
        </TaskDropContainer>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        height: 42,
        backgroundColor: Colors.white,
        borderRadius: 12,
        // paddingTop: 5,
        // paddingBottom: 5,
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

export default Task
