import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { Colors } from '../../styles'
import { TTaskSection } from '../../utils/types'
import TaskShell from './TaskContainer'

interface TaskSectionsProps {
    section: TTaskSection
}
const TaskSections = (props: TaskSectionsProps) => {
    return (
        <View>
            {props.section.tasks.map((task, index) => {
                return (
                    <TaskShell style={styles.shell} key={index}>
                        <View style={styles.container}>
                            <Text>{task.title}</Text>
                        </View>
                    </TaskShell>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    shell: {
        marginTop: 20,
    },
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: 'pink',
    },
})

export default TaskSections
