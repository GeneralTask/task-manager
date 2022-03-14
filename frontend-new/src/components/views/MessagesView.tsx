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
        if (messages && !atEnd) {
            if (messages.length < MESSAGES_PER_PAGE) {
                setAtEnd(true)
            }
            setAllMessages(allMessages.concat(messages))
        } else if (messages && atEnd) {
            setAtEnd(false)
            setAllMessages([])
            setCurrentPage(1)
        }
    }, [messages])

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
                        {allMessages?.map(msg => {
                            return (
                                <TaskTemplate style={styles.shell} key={msg.id}>
                                    <Message message={msg} setSheetTaskId={() => null} />
                                </TaskTemplate>
                            )
                        })}
                        <Text style={styles.endContent}>{atEnd ? `You've reached the bottom` : `Loading...`}</Text>
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
