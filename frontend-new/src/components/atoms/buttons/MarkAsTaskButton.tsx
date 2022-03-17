import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useMarkMessageAsTaskMutation } from '../../../services/generalTaskApi'
import { icons } from '../../../styles/images'

interface MarkAsTaskButtonProps {
    isTask: boolean
    messageId: string
    style?: ViewStyle
}
const MarkAsTaskButton = (props: MarkAsTaskButtonProps) => {
    const [markAsTask] = useMarkMessageAsTaskMutation()

    const buttonPressHandler = () => {
        markAsTask({ id: props.messageId, is_task: !props.isTask })
    }
    return (
        <View style={[styles.container, props.style]}>
            <TouchableOpacity style={styles.image} onPress={buttonPressHandler}>
                {props.isTask ? (
                    <Image style={styles.image} source={icons['mark_as_task_active']} />
                ) : (
                    <Image style={styles.image} source={icons['mark_as_task']} />
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
export default MarkAsTaskButton
