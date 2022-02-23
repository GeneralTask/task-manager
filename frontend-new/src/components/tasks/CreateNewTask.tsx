import React, { useState } from 'react'
import { View, TextInput, StyleSheet, Image, Platform } from 'react-native'
import TaskBox from './TaskContainer'
import { Colors, Flex } from '../../styles'
import KeyboardShotcutContainer from '../common/KeyboardShotcutContainer'
import { useCreateTaskMutation } from '../../services/generalTaskApi'

interface CreateNewTaskProps {
    section: String
}
const CreatNewTask = (props: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const [createTask] = useCreateTaskMutation()

    const submitNewTask = async () => {
        await createTask({
            title: text,
            body: '',
            id_task_section: props.section
        })
        setText('')
    }
    return (
        <TaskBox>
            <View style={styles.container}>
                <View style={styles.plusIconContainer}>
                    <Image style={styles.plusIcon} source={require('../../assets/plus.png')} />
                </View>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={text => setText(text)}
                    placeholder="Add new task"
                    onSubmitEditing={submitNewTask}
                />
                {Platform.OS === 'web' && <KeyboardShotcutContainer style={styles.tool} character={'T'} />}
            </View>
        </TaskBox>
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
        borderRadius: 12,
    },
    plusIconContainer: {
        height: 20,
        width: 20,
        marginRight: 10,
    },
    plusIcon: {
        width: '100%',
        height: '100%',
    },
    inputContainer: {
        flexGrow: 1,
        minWidth: 0,

    },
    input: {
        ...Platform.select({
            ios: {
                width: '90%',
                marginRight: 10,
            },
            default: {
                outlineStyle: 'none',
                flexGrow: 1,
            }
        })
    },
    tool: {

    }
})

export default CreatNewTask
