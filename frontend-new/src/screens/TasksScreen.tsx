import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { useAppDispatch } from '../redux/hooks'
import { Screens, Flex } from '../styles'
import { authSignOut } from '../utils/auth'


const TasksScreen = () => {
    const dispatch = useAppDispatch()
    return (
        <View style={styles.container}>
            <Text>Authorized Tasks Screen</Text>
            <Pressable style={styles.signOut} onPress={() => authSignOut(dispatch)}>
                <Text>Sign Out</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
    },
    signOut: {
        ...Platform.select({
            ios: {},
            default: {
                width: '100px',
            }
        }),
        backgroundColor: 'red'
    }
})

export default TasksScreen
