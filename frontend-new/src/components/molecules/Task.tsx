import React, { Ref, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components/native'
import { Border, Colors, Spacing } from '../../styles'
import { logos } from '../../styles/images'
import { ItemTypes, TTask } from '../../utils/types'
import CompleteButton from '../atoms/buttons/CompleteButton'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import TaskTemplate from '../atoms/TaskTemplate'

const PressableContainer = styled.Pressable<{ isSelected: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: ${Colors.white};
    border-radius: ${Border.radius.xxSmall};
    padding: 0 ${Spacing.padding.small}px;
    border: 1px solid ${(props) => (props.isSelected ? Colors.gray._500 : Colors.gray._100)};
`

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
    const [isSelected, setIsSelected] = React.useState(false)
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
    useEffect(() => {
        if (params.task === task.id) {
            setIsSelected(true)
        } else {
            setIsSelected(false)
        }
    }, [[params]])

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
        <TaskTemplate>
            <PressableContainer isSelected={isSelected} onPress={onPress} ref={dragPreviewRef}>
                {Platform.OS === 'web' && !dragDisabled && <Domino ref={dragRef} />}
                <CompleteButton taskId={task.id} isComplete={task.is_done} />
                <View style={styles.iconContainer}>
                    <Icon source={logos[task.source.logo_v2]} size="small" />
                </View>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'}>
                    {task.title}
                </Text>
            </PressableContainer>
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
