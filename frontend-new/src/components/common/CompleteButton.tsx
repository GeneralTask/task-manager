import React from 'react'
import { View, TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native'
import { useMarkTaskDoneMutation } from '../../services/generalTaskApi'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    style?: ViewStyle
}
const CompleteButton = (props: CompleteButtonProps) => {
    const [markTaskDone] = useMarkTaskDoneMutation()

    const donePressHandler = () => {
        markTaskDone({ id: props.taskId, is_completed: true })

    }
    return (
        <View style={[styles.container, props.style]}>
            <TouchableOpacity style={styles.image} onPress={donePressHandler}>
                {props.isComplete ?
                    <Image style={styles.image} source={require('../../assets/task_complete.png')} /> :
                    <Image style={styles.image} source={require('../../assets/task_incomplete.png')} />
                }
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
    }
})
export default CompleteButton
