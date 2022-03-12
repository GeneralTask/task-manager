import React, { useEffect, useRef, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MESSAGES_PER_PAGE } from '../../constants'
import { useFetchMessagesQuery, useGetMessagesQuery } from '../../services/generalTaskApi'
import { Colors, Flex, Screens, Shadows } from '../../styles'
import { TMessage } from '../../utils/types'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import { SectionHeader } from '../molecules/Header'
import Message from '../molecules/Message'

const Messages = () => {
    const [currentPage, setCurrentPage] = useState(1)
    const [atEnd, setAtEnd] = useState(false)
    const [allMessages, setAllMessages] = useState([] as TMessage[])
    const { data: messages, isLoading, refetch, isFetching } = useGetMessagesQuery(currentPage)
    const { refetch: fetchMessages } = useFetchMessagesQuery()
    const refetchWasLocal = useRef(false)

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const viewHeight = event.nativeEvent.layoutMeasurement.height
        const offsetY = event.nativeEvent.contentOffset.y
        const contentHeight = event.nativeEvent.contentSize.height

        if (offsetY + viewHeight >= contentHeight - 400) {
            if (!isFetching && !refetchWasLocal.current && !atEnd) {
                setCurrentPage(currentPage + 1)
            }
        }
    }

    useEffect(() => {
        if (messages) {
            if (messages.length < MESSAGES_PER_PAGE) {
                setAtEnd(true)
            }
            setAllMessages(allMessages.concat(messages))
        }
    }, [messages])

    // const lastResult = {
    //     query: useGetMessagesQuery(currentPage - 1, { skip: currentPage === 1 }),
    //     offset: currentPage === 1 ? 0 : MESSAGES_PER_PAGE * (currentPage - 2),
    // }
    // const currentResult = {
    //     query: useGetMessagesQuery(currentPage),
    //     offset: MESSAGES_PER_PAGE * (currentPage - 1),
    // }
    // const nextResult = {
    //     query: useGetMessagesQuery(currentPage + 1),
    //     offset: MESSAGES_PER_PAGE * currentPage,
    // }

    // const combined = useMemo(() => {
    //     // if (lastResult.query.isFetching || currentResult.query.isFetching || nextResult.query.isFetching) return
    //     const arr: TMessage[] = new Array(MESSAGES_PER_PAGE * (currentPage + 1))
    //     for (const data of [lastResult, currentResult, nextResult]) {
    //         if (data && data.query.data && !data.query.isFetching) {
    //             arr.splice(data.offset, data.query.data.length, ...data.query.data)
    //         }
    //     }
    //     console.log(nextResult.query.data)
    //     return arr
    // }, [lastResult.query.data, currentResult.query.data, nextResult.query.data])


    // Refetches messages every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchMessages(), 30000)
        return () => clearInterval(interval)
    }, [])

    const refreshControl = <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />

    return (
        <ScrollView style={styles.container} refreshControl={refreshControl} onScroll={handleScroll} scrollEventThrottle={500}>
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
                        {allMessages?.map(msg => {
                            // console.log(messages)
                            return (
                                <TaskTemplate style={styles.shell} key={msg.id}>
                                    <Message message={msg} setSheetTaskId={() => null} />
                                </TaskTemplate>
                            )
                        })}
                        <Text style={styles.endContent}> </Text>
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
    endContent: {
        ...Flex.column,
        marginRight: '7.5%',
        marginLeft: '7.5%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 100,
    },
})

export default Messages
