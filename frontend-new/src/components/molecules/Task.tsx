import React from 'react'
import { Platform, Pressable, View, Text, StyleSheet } from 'react-native'
import { Colors, Flex } from '../../styles'
import { TTask } from '../../utils/types'
import CompleteButton from '../atoms/buttons/CompleteButton'
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
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <View style={styles.container}>
                <CompleteButton taskId={task.id} isComplete={task.is_done} />
                <View style={styles.iconContainer}>
                    <Icon size="small" />
                </View>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode={'tail'} >{task.title}</Text>
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
        paddingLeft: 9,
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
