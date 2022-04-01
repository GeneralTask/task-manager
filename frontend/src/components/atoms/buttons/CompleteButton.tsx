import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'

import { useKeyboardShortcut } from '../KeyboardShortcuts'
import { KEYBOARD_SHORTCUTS } from '../../../constants'
import React from 'react'
import { icons } from '../../../styles/images'
import { useMarkTaskDone } from '../../../services/api-query-hooks'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    isSelected: boolean
    style?: ViewStyle
}
const CompleteButton = (props: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()

    const donePressHandler = () => {
        markTaskDone({ taskId: props.taskId, isCompleted: !props.isComplete })
    }
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.MARK_COMPLETE, donePressHandler, !props.isSelected)
    return (
        <View style={[styles.container, props.style]}>
            <TouchableOpacity style={styles.image} onPress={donePressHandler}>
                {props.isComplete ? (
                    <Image style={styles.image} source={icons['task_complete']} />
                ) : (
                    <Image style={styles.image} source={icons['task_incomplete']} />
                )}
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 20,
        height: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },
})
export default CompleteButton
