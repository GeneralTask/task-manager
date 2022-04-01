import { Colors, Flex, Images } from '../../styles'
import {
    Image,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { KEYBOARD_SHORTCUTS } from '../../constants'
import { useCreateTask } from '../../services/api-query-hooks'
import KeyboardShortcut from '../atoms/KeyboardShortcut'

interface CreateNewTaskProps {
    section: string
}
const CreateNewTask = (props: CreateNewTaskProps) => {
    const inputRef = useRef<TextInput>(null)

    // web only
    const [isFocused, setIsFocused] = useState(false)
    useEffect(() => {
        if (isFocused) {
            inputRef.current?.focus()
        } else {
            inputRef.current?.blur()
        }
    }, [isFocused])

    const onBlur = useCallback(() => setIsFocused(false), [])

    const [text, setText] = useState('')
    const { mutate: createTask } = useCreateTask()

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            createTask({
                title: text,
                body: '',
                id_task_section: props.section,
            })
        }
    }
    const handleKeyDown = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === 'Enter') {
            submitNewTask()
        } else if (e.nativeEvent.key === 'Escape') {
            onBlur()
        }
    }
    return (
        <View style={styles.container}>
            <View style={styles.plusIconContainer}>
                <Image style={styles.plusIcon} source={Images.icons.plus} />
            </View>
            <TextInput
                style={styles.input}
                value={text}
                onChangeText={(text) => setText(text)}
                onBlur={onBlur}
                placeholder="Add new task"
                onKeyPress={handleKeyDown}
                blurOnSubmit={false}
                ref={inputRef}
            />
            <KeyboardShortcut shortcut={KEYBOARD_SHORTCUTS.CREATE_TASK} onKeyPress={() => setIsFocused(true)} />
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
        marginBottom: 10,
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
            },
        }),
    },
    tool: {},
})

export default CreateNewTask
