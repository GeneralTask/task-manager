import Cookies from 'js-cookie'
import React, { useEffect } from 'react'
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity } from 'react-native'
import { useAppDispatch } from '../../redux/hooks'
import { setAuthToken } from '../../redux/userDataSlice'
import { useDeleteTaskSectionMutation, useGetTasksQuery } from '../../services/generalTaskApi'
import { Typography, Flex } from '../../styles'

interface TasksScreenHeaderProps {
    title: string
    id: string
}
const TasksScreenHeader = ({ title, id }: TasksScreenHeaderProps) => {
    const dispatch = useAppDispatch()
    const [deleteTaskSection] = useDeleteTaskSectionMutation()
    useEffect(() => {
        if (Platform.OS === 'web') dispatch(setAuthToken(Cookies.get('authToken')))
    }, [])
    const { refetch } = useGetTasksQuery()

    const tempSectionIds = [
        '000000000000000000000001',
        '000000000000000000000002',
        '000000000000000000000003',
        '000000000000000000000004',
    ]
    const matchTempSectionId = (id: string) => tempSectionIds.includes(id)

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>{title}</Text>
            {
                Platform.OS === 'web' &&
                <TouchableOpacity onPress={refetch}>
                    <Image style={styles.icon} source={require('../../assets/spinner.png')} />
                </TouchableOpacity>
            }
            {
                !matchTempSectionId(id) &&
                <TouchableOpacity onPress={() => deleteTaskSection({ id: id })}>
                    <Image style={styles.icon} source={require('../../assets/trash.png')} />
                </TouchableOpacity>
            }
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
    icon: {
        width: 20,
        height: 20,
        marginRight: 5,
    }
})

export default TasksScreenHeader
