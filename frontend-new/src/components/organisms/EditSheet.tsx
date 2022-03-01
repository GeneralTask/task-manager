import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors, Dimensions, Flex } from '../../styles'
import { TTask } from '../../utils/types'
import Handle from '../atoms/GrayHandle'
import { Icon } from '../atoms/Icon'
import { Subtitle } from '../atoms/subtitle/Subtitle'
import { Title } from '../atoms/title/Title'
import { Divider } from '../atoms/SectionDivider'
import { GraySubtitle } from '../atoms/subtitle/GraySubtitle'


interface EditSheetProps {
    task: TTask
}

const EditSheet = ({ task }: EditSheetProps) => {
    return (
        <View style={styles.container}>
            <Handle />
            <View style={styles.paddedContainer}>
                <Title style={styles.title}>Edit Task</Title>
                <View style={styles.subtitleContainer}>
                    <Icon />
                    <Subtitle style={styles.subtitle}>{task.title}</Subtitle>
                </View>
            </View>
            <Divider />
            <View style={styles.paddedContainer}>
                <View style={styles.detailsContainer}>
                    <GraySubtitle style={styles.subtitle}>Details</GraySubtitle>
                    <Subtitle style={styles.subtitle}>{task.body}</Subtitle>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.column,
        backgroundColor: Colors.white,
        paddingTop: 16,
        height: Dimensions.editSheetHeight,
    },
    paddedContainer: {
        paddingHorizontal: 16,
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
    graySubtitle: {
        marginBottom: 8,
    },
    detailsContainer: {
        ...Flex.column,
        marginTop: 8,
        marginBottom: 8,
    },
})

export default EditSheet
