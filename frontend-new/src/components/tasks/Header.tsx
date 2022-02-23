import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
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
        gap: 5
    },
    headerText: {
        ...Typography.xLarge
    },
    spinner: {
        width: '20px',
        height: '20px',
    }
})

export default TasksScreenHeader
