import React from 'react'
import { View, Text, Image, StyleSheet, Platform } from 'react-native'
import { Typography, Flex } from '../../styles'
const TasksScreenHeader = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>Tasks</Text>
            <Image style={styles.spinner} source={require('../../assets/spinner.png')}></Image>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        alignItems: 'center',
        marginBottom: 15,
    },
    headerText: {
        ...Typography.xLarge,
        marginRight: 5,
    },
    spinner: {
        width: 20,
        height: 20,
    }
})

export default TasksScreenHeader
