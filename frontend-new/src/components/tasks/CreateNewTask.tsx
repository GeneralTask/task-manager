import React, { useState } from 'react'
import { View, Text, StyleSheet, Image, TextInput, Platform } from 'react-native'
import TaskShell from './TaskShell'
import { Colors, Flex } from '../../styles'

const CreatNewTask = () => {
    const [text, onChangeText] = useState('')
    return (
        <TaskShell>
            <View style={styles.container}>
                <View style={styles.plusIconContainer}>
                    <Image style={styles.plusIcon} source={require('../../assets/plus.png')} />
                </View>
                <input placeholder='Add new task'></input>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={text => onChangeText(text)}
                    placeholder="Add new task"
                />
            </View>
        </TaskShell>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        backgroundColor: Colors.gray._100,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        gap: 10,
    },
    plusIconContainer: {
        height: '50%',
        width: undefined,
        aspectRatio: 1,
    },
    plusIcon: {
        width: '100%',
        height: '100%',
    },
    input: {
        flexGrow: 1,
        ...Platform.select({
            ios: {},
            default: {
                border: 0,
                outline: 'none !important',
            }
        })
    }
})

export default CreatNewTask
