import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Colors, Flex, Shadows } from '../../styles'
import { TTaskSection } from '../../utils/types'
import CompleteButton from '../common/CompleteButton'
import TaskBox from './TaskContainer'

interface TaskSectionsProps {
    section: TTaskSection
}
const TaskSections = (props: TaskSectionsProps) => {
    return (
        <View>
            {props.section.tasks.map((task, index) => {
                return (
                    <TaskBox style={styles.shell} key={index}>
                        <View style={styles.container}>
                            <CompleteButton isComplete={false} />
                            <View style={styles.iconContainer}>
                                <Image style={styles.icon} source={require('../../assets/generaltask.png')} />
                            </View>
                            <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.title}>{task.title}</Text>
                        </View>
                    </TaskBox>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    shell: {
        marginTop: 20,
        ...Shadows.small
    },
    container: {
        ...Flex.row,
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 12,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 12,
        paddingRight: 12,
    },
    iconContainer: {
        width: 20,
        height: 20,
        ...Flex.column,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    icon: {
        width: '100%',
        height: undefined,
        aspectRatio: 512 / 366,
    },
    title: {
        marginLeft: 12,
        flexShrink: 1,
        flexWrap: 'wrap',
    }
})

export default TaskSections
