import { ItemTypes, TTask } from '../../utils/types'
import { Platform, StyleSheet, Text, View } from 'react-native'
import React, { Ref, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import { InvisibleKeyboardShortcut } from '../atoms/KeyboardShortcuts'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import TaskTemplate from '../atoms/TaskTemplate'
import { logos } from '../../styles/images'
import { useAppSelector } from '../../redux/hooks'
import { useDrag } from 'react-dnd'
import ItemContainer from './ItemContainer'

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
    const isExpanded = params.task === task.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === task.id)

    const hideDetailsView = () => navigate(`/tasks/${params.section}`)

    const onClick = useCallback(() => {
        if (Platform.OS === 'ios') {
            setSheetTaskId(task.id)
        }
        if (params.task === task.id) {
            hideDetailsView()
        } else {
            navigate(`/tasks/${params.section}/${task.id}`)
        }
    }, [params, task])

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

    const dragPreviewRef = Platform.OS === 'web' ? (dragPreview as Ref<HTMLDivElement>) : undefined
    const dragRef = Platform.OS === 'web' ? (drag as Ref<View>) : undefined

    return (
        <TaskTemplate>
            <ItemContainer isSelected={isSelected} onClick={onClick} ref={dragPreviewRef}>
                {Platform.OS === 'web' && !dragDisabled && <Domino ref={dragRef} />}
                <CompleteButton taskId={task.id} isComplete={task.is_done} isSelected={isSelected} />
                <View style={styles.iconContainer}>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                </View>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
                    {task.title}
                </Text>
            </ItemContainer>
            {isSelected && Platform.OS === 'web' && <>
                <InvisibleKeyboardShortcut shortcut={KEYBOARD_SHORTCUTS.CLOSE} onKeyPress={hideDetailsView} />
                <InvisibleKeyboardShortcut shortcut={KEYBOARD_SHORTCUTS.SELECT} onKeyPress={onClick} />
            </>}
        </TaskTemplate>
    )
}

const styles = StyleSheet.create({
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
