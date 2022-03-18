import React, { useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { useModifyTaskMutation } from '../../services/generalTaskApi'
import { Colors, Dimensions, Flex } from '../../styles'
import { TTask } from '../../utils/types'
import Handle from '../atoms/GrayHandle'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { GraySubtitle } from '../atoms/subtitle/GraySubtitle'
import { Subtitle } from '../atoms/subtitle/Subtitle'
import { TitleMedium } from '../atoms/title/Title'

interface EditSheetProps {
    task: TTask
    setText: (text: string) => void
}

const EditSheet = ({ task, setText: propsSetText }: EditSheetProps) => {
    const inputRef = useRef<TextInput>(null)
    const [text, setText] = useState(task.body)
    const [modifyTask] = useModifyTaskMutation()

    return (
        <View style={styles.container}>
            <View style={{ backgroundColor: 'transparent', height: 200 }} />
            <View style={{ backgroundColor: Colors.white }}>
                <View style={styles.handleContainer}>
                    <Handle />
                </View>
                <View style={styles.paddedContainer}>
                    <TitleMedium>Edit Task</TitleMedium>
                    <View style={styles.subtitleContainer}>
                        <Icon size="small" />
                        <Subtitle style={styles.subtitle}>{task.title}</Subtitle>
                    </View>
                </View>
                <Divider />
                <View style={styles.paddedContainer}>
                    <View style={styles.detailsContainer}>
                        <GraySubtitle>Details</GraySubtitle>
                        <TextInput
                            onSubmitEditing={() =>
                                modifyTask({
                                    id: task.id,
                                    body: text,
                                })
                            }
                            onChangeText={(text) => {
                                setText(text)
                                propsSetText(text)
                            }}
                            ref={inputRef}
                            numberOfLines={20}
                            multiline={true}
                            style={{ height: '100%', textAlignVertical: 'top' }}
                            placeholder="Add Details"
                        >
                            {text}
                        </TextInput>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.column,
        paddingTop: 16,
        height: Dimensions.editSheetHeight,
    },
    paddedContainer: {
        paddingHorizontal: 16,
    },
    handleContainer: {
        marginTop: 12,
    },
    title: {
        marginTop: 24,
    },
    subtitleContainer: {
        ...Flex.row,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    subtitle: {
        marginLeft: 8,
    },
    detailsContainer: {
        ...Flex.column,
        marginTop: 8,
        marginBottom: 8,
    },
    textFocusArea: {
        flexGrow: 1,
        height: '100%',
    },
})

export default EditSheet
