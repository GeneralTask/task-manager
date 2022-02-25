import Cookies from 'js-cookie'
import React, { useEffect } from 'react'
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity } from 'react-native'
import { useAppDispatch } from '../../redux/hooks'
import { setAuthToken } from '../../redux/userDataSlice'
import { useGetTasksQuery } from '../../services/generalTaskApi'
import { Typography, Flex } from '../../styles'

interface Props {
    title: string
}
const TasksScreenHeader = ({ title }: Props) => {
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (Platform.OS === 'web') dispatch(setAuthToken(Cookies.get('authToken')))
    }, [])
    const { refetch } = useGetTasksQuery()

    return (
        <View style={styles.container}>
            <Text style={styles.headerText}>{title}</Text>
            {
                Platform.OS === 'web' &&
                <TouchableOpacity onPress={refetch}>
                    <Image style={styles.spinner} source={require('../../assets/spinner.png')} />
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
    spinner: {
        width: 20,
        height: 20,
    }
})

export default TasksScreenHeader
