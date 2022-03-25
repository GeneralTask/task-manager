import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useMarkMessageAsTask } from '../../../services/api-query-hooks'
import { icons } from '../../../styles/images'

interface MarkAsTaskButtonProps {
    isTask: boolean
    messageId: string
    style?: ViewStyle
}
const MarkAsTaskButton = (props: MarkAsTaskButtonProps) => {
    const { mutate: markAsTask } = useMarkMessageAsTask()

    const buttonPressHandler = () => {
        markAsTask({ id: props.messageId, isTask: !props.isTask })
    }
    return (
        <View style={[styles.container, props.style]}>
            <TouchableOpacity style={styles.image} onPress={buttonPressHandler}>
                <Image style={styles.image} source={icons['mark_as_task']} />
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
