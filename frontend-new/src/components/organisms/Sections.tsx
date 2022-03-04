import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Shadows } from '../../styles'
import { TTaskSection } from '../../utils/types'
import TaskTemplate from '../atoms/TaskTemplate'
import Task from '../molecules/Task'

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
})

export default TaskSections
