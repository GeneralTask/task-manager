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
        width: '80%',
        position: 'relative',
        height: Platform.OS === 'web' ? '48px' : '100%',
        borderRadius: 12,
        overflow: 'hidden',
    }
})

export default TaskShell
