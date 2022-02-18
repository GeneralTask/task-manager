import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Screens, Flex } from '../styles'
import { authSignOut } from '../utils/auth'


const TasksScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Authorized Tasks Screen</Text>
            <Pressable style={styles.signOut} onPress={() => authSignOut()}>
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
        width: '100px',
        backgroundColor: 'red'
    }
})

export default TasksScreen
