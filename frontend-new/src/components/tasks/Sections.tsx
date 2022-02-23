import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { TTaskSection } from '../../utils/types'

interface TaskSectionsProps {
    taskSections: TTaskSection[]
}
const TaskSections = (props: TaskSectionsProps) => {
    return (
        <View>
            <Text>Task Sections</Text>
            <Text>{props.taskSections.length}</Text>
        </View>
    )
}

export default TaskSections
