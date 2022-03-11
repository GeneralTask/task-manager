import { Colors, Flex } from '../../styles'
import { Image, Platform, StyleSheet, TextInput, View } from 'react-native'
import React, { useCallback, useState } from 'react'

import KeyboardShotcutContainer from '../atoms/ShortcutHint'
import { useCreateTaskMutation } from '../../services/generalTaskApi'

interface CreateNewTaskProps {
    section: string
}
const CreatNewTask = (props: CreateNewTaskProps) => {
    const inputRef = useCallback(node => {
        if (node !== null) {
            node.focus()
        }
    }, [])
    const [text, setText] = useState('')
    const [createTask] = useCreateTaskMutation()

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            await createTask({
                title: text,
                body: '',
                id_task_section: props.section
            })
        }
    }
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.key === 'Enter') {
            submitNewTask()
        }
    }
    return (
        <View style={styles.container}>
            <View style={styles.plusIconContainer}>
                <Image style={styles.plusIcon} source={require('../../assets/plus.png')} />
            </View>
            {
                Platform.OS === 'web' ?
                    <input
                        style={webInputStyles}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder='Add new task'
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                    /> :
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={text => setText(text)}
                        placeholder="Add new task"
                        onSubmitEditing={submitNewTask}
                    />
            }

            {Platform.OS === 'web' && <KeyboardShotcutContainer style={styles.tool} character={'T'} />}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.row,
        backgroundColor: Colors.gray._100,
        width: '100%',
        height: 48,
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
const webInputStyles = {
    flexGrow: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
}

export default CreatNewTask
