import React, { Ref } from 'react'
import { useDrag } from 'react-dnd'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigate, useParams } from 'react-router-dom'
import { Colors, Flex, Shadows } from '../../styles'
import { logos } from '../../styles/images'
import { ItemTypes, TTask } from '../../utils/types'
import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import TaskTemplate from '../atoms/TaskTemplate'

interface TaskProps {
    task: TTask
    setSheetTaskId: (label: string) => void
    dragDisabled: boolean
    index: number
    sectionId: string
}

const Task = ({ task, setSheetTaskId, dragDisabled, index, sectionId }: TaskProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const onPress = () => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(task.id)
        }
        if (params.task === task.id) {
            navigate(`/tasks/${params.section}`)
        } else {
            navigate(`/tasks/${params.section}/${task.id}`)
        }
    }

    const [, drag, dragPreview] = useDrag(
        () => ({
            type: ItemTypes.TASK,
            item: { id: task.id, taskIndex: index, sectionId },
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [task.id, index, sectionId]
    )

    const dragPreviewRef = Platform.OS === 'web' ? (dragPreview as Ref<View>) : undefined
    const dragRef = Platform.OS === 'web' ? (drag as Ref<View>) : undefined

    return (
        <TaskTemplate style={styles.templateMargin}>
            <Pressable style={[styles.container, styles.shadow]} onPress={onPress} ref={dragPreviewRef}>
                {Platform.OS === 'web' && !dragDisabled && <Domino ref={dragRef} />}
                <CompleteButton taskId={task.id} isComplete={task.is_done} />
                <View style={styles.iconContainer}>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                </View>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
                    {task.title}
                </Text>
            </Pressable>
        </TaskTemplate>
    )
}

const styles = StyleSheet.create({
    templateMargin: {
        // marginVertical: 6,
    },
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 4,
        paddingHorizontal: 8,
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

export default Task
