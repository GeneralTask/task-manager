import React, { useCallback, useEffect, useRef } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useInfiniteQuery } from 'react-query'
import { useFetchMessagesQuery } from '../../services/generalTaskApi'
import { fetchInfiniteMessages } from '../../services/queryUtils'
import { Colors, Flex, Screens } from '../../styles'
import Loading from '../atoms/Loading'
import Message from '../molecules/Message'
import { SectionHeader } from '../molecules/Header'
import { TMessage } from '../../utils/types'
import TaskTemplate from '../atoms/TaskTemplate'

const Messages = () => {
    const { refetch: refetchMessages } = useFetchMessagesQuery()
    const { data, isLoading, isFetching, fetchNextPage, refetch } = useInfiniteQuery(
        'messages',
        fetchInfiniteMessages,
        {
            getNextPageParam: (_, pages) => pages.length + 1,
        }
    )

    const observer = useRef<IntersectionObserver>()
    const lastElementRef = useCallback(
        (node) => {
            if (isLoading || isFetching) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isLoading]
    )

    // Tell the backend to refetch messages from the server every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refetchMessages()
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <ScrollView>
            <View style={styles.messagesContent}>
                <SectionHeader section="Messages" allowRefresh={true} refetch={refetch} />
                {data?.pages.map((page, index) => {
                    return page?.map((message: TMessage, msgIndex: number) => {
                        if (data.pages.length === index + 1 && page.length === msgIndex + 1) {
                            return (
                                <TaskTemplate ref={lastElementRef} style={styles.shell} key={message.id}>
                                    <Message message={message} setSheetTaskId={() => null} />
                                </TaskTemplate>
                            )
                        }
                        return (
                            <TaskTemplate style={styles.shell} key={message.id}>
                                <Message message={message} setSheetTaskId={() => null} />
                            </TaskTemplate>
                        )
                    })
                })}
                {(isLoading || isFetching) && <Loading />}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    shell: {
        marginVertical: 6,
    },
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50,
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
