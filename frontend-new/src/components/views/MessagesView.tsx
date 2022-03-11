import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { MESSAGES_PER_PAGE } from '../../constants'
import { useFetchMessagesQuery, useGetMessagesQuery } from '../../services/generalTaskApi'
import { Colors, Flex, Screens, Shadows } from '../../styles'
import { icons } from '../../styles/images'
import { TMessage } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import { SectionHeader } from '../molecules/Header'
import Message from '../molecules/Message'

const Messages = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const { data: messages, isLoading, refetch, isFetching } = useGetMessagesQuery(currentPage)
    const { refetch: fetchMessages } = useFetchMessagesQuery()
    const refetchWasLocal = useRef(false)

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }

    const lastResult = {
        query: useGetMessagesQuery(currentPage - 1, { skip: currentPage === 1 }),
        offset: currentPage === 1 ? 0 : MESSAGES_PER_PAGE * (currentPage - 2),
    }
    const currentResult = {
        query: useGetMessagesQuery(currentPage),
        offset: MESSAGES_PER_PAGE * (currentPage - 1),
    }
    const nextResult = {
        query: useGetMessagesQuery(currentPage + 1),
        offset: MESSAGES_PER_PAGE * currentPage,
    }

    const combined = useMemo(() => {
        const arr: TMessage[] = new Array(MESSAGES_PER_PAGE * (currentPage + 1))
        for (const data of [lastResult, currentResult, nextResult]) {
            if (data && data.query.data) {
                arr.splice(data.offset, data.query.data.length, ...data.query.data)
            }
        }
        return arr
    }, [currentPage, lastResult.query.data, currentResult.query.data, nextResult.query.data])


    // Refetches messages every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchMessages(), 30000)
        return () => clearInterval(interval)
    }, [])

    const refreshControl = <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />

    return (
        <ScrollView style={styles.container} refreshControl={refreshControl}>
            <View style={styles.messagesContent}>
                {isLoading ? <Loading /> :
                    <View>
                        <SectionHeader section="Messages" allowRefresh={true} refetch={refetch} />
                        {/* <View style={{ flex: 1, flexDirection: 'row' }}>
                            <Pressable onPress={() => setCurrentPage(currentPage === 1 ? currentPage : currentPage - MESSAGES_PER_PAGE)} >
                                <Icon source={icons['caret_left']} size="small" />
                            </Pressable>
                            <Text>Page {(currentPage - 1) / 10 + 1}</Text>
                            <Pressable onPress={() => setCurrentPage(currentPage + MESSAGES_PER_PAGE)} >
                                <Icon source={icons['caret_right']} size="small" />
                            </Pressable>
                        </View> */}
                        {combined?.map(msg => {
                            // console.log(messages)
                            return (
                                <TaskTemplate style={styles.shell} key={msg.id}>
                                    <Message message={msg} setSheetTaskId={() => null} />
                                </TaskTemplate>
                            )
                        })}
                        <Pressable onPress={() => setCurrentPage(currentPage + MESSAGES_PER_PAGE)} >
                            <Icon source={icons['chevron_down']} size="medium" />
                        </Pressable>
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
