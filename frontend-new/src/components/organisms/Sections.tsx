import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { Colors, Dimensions, Flex, Shadows } from '../../styles'
import { TTask, TTaskSection } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import CompleteButton from '../atoms/buttons/CompleteButton'
import TaskTemplate from '../atoms/TaskTemplate'


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
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <View style={styles.container}>
                <CompleteButton taskId={task.id} isComplete={false} />
                <Icon style={styles.iconContainer} />
                <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.title}>{task.title}</Text>
            </View>
        </Pressable>
    )
}

interface TaskSectionsProps {
    section: TTaskSection
    setSheetTaskId: (id: string) => void
}

const TaskSections = (props: TaskSectionsProps) => {
    return (
        <View>
            {props.section.tasks.map((task, index) => {
                return (
                    <TaskTemplate style={styles.shell} key={index}>
                        <Task task={task} setSheetTaskId={props.setSheetTaskId} />
                    </TaskTemplate>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    shell: {
        marginTop: 20,
        ...Shadows.small
    },
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 9,
    },
    iconContainer: {
        width: 20,
        height: 20,
        ...Flex.column,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    icon: {
        width: '100%',
        height: undefined,
        aspectRatio: Dimensions.iconRatio,
    },
    title: {
        marginLeft: 9,
        flexShrink: 1,
        flexWrap: 'wrap',
    }
})

export default TaskSections
