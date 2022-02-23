import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'

interface ShellProps {
    style?: ViewStyle
    children: React.ReactNode | React.ReactNode[]
}
const TaskBox = (props: ShellProps) => {
    return (
        <View style={[props.style, styles.container]}>
            {props.children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
    }
})

export default TaskBox
