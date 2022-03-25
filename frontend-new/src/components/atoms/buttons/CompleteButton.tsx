import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useMarkTaskDone } from '../../../services/api-query-hooks'
import { icons } from '../../../styles/images'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    style?: ViewStyle
}
const CompleteButton = (props: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()

    const donePressHandler = () => {
        markTaskDone({ taskId: props.taskId, isCompleted: !props.isComplete })
    }
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
