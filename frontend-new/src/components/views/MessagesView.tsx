import React, { useRef } from 'react'
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useGetMessagesQuery } from '../../services/generalTaskApi'
import { Colors, Flex, Screens, Shadows } from '../../styles'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import { MessagesScreenHeader } from '../molecules/Header'
import Message from '../molecules/Message'

const Messages = () => {
    const { data: messages, isLoading, refetch, isFetching } = useGetMessagesQuery()
    const refetchWasLocal = useRef(false)

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }

    const refreshControl = <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />

    return (
        <ScrollView style={styles.container} refreshControl={refreshControl}>
            <View style={styles.messagesContent}>
                {(isLoading || !messages) ? <Loading /> :
                    <View>
                        <MessagesScreenHeader />
                        {messages.map((msg, index) => {
                            return (
                                <TaskTemplate style={styles.shell} key={msg.id}>
                                    <Message message={msg} setSheetTaskId={() => null} />
                                </TaskTemplate>
                            )
                        })}
                    </View>
                }
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    shell: {
        marginTop: 20,
        ...Shadows.small
    },
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50
    },
    messagesContent: {
        ...Flex.column,
        marginRight: '7.5%',
        marginLeft: '7.5%',
        marginTop: Platform.OS === 'web' ? 40 : 20,
        marginBottom: 100,
    },
})

export default Messages
