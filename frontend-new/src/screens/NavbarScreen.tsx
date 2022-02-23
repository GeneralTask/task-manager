import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { useAppDispatch } from '../redux/hooks'
import { Screens, Flex } from '../styles'
import { authSignOut } from '../utils/auth'

const NavbarScreen = () => {
    const dispatch = useAppDispatch()
    return (
        <View style={styles.container}>
            <Text>Navbar Screen</Text>
            <Pressable style={styles.navbarButton}>
                <Text>Today</Text>
            </Pressable>
            <Pressable style={styles.navbarButton}>
                <Text>Blocked</Text>
            </Pressable>
            <Pressable style={styles.navbarButton}>
                <Text>Backlog</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
    },
    navbarButton: {
        ...Platform.select({
            ios: {},
            default: {
                width: '100px',
            }
        }),
        backgroundColor: 'gray'
    }
})

export default NavbarScreen
