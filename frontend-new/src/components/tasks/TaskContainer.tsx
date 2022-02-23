import React from 'react'
import { View, StyleSheet, Platform } from 'react-native'

interface ShellProps {
    children: React.ReactNode | React.ReactNode[]
}
const TaskShell = (props: ShellProps) => {
    return (
        <View style={styles.container}>
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

export default TaskShell
