import React, { useCallback, useEffect, useRef } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useFetchMessages, useGetInfiniteMessages } from '../../services/api-query-hooks'
import { Colors, Flex, Screens } from '../../styles'
import { TMessage } from '../../utils/types'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import { SectionHeader } from '../molecules/Header'
import Message from '../molecules/Message'

const Messages = () => {
    const { refetch: refetchMessages } = useFetchMessages()
    const { data, isLoading, isFetching, fetchNextPage } = useGetInfiniteMessages()

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
                <SectionHeader sectionName="Messages" allowRefresh={true} refetch={refetchMessages} />
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
        marginVertical: 1,
    },
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50,
    },
    messagesContent: {
        ...Flex.column,
        marginRight: 10,
        marginLeft: 10,
        marginTop: Platform.OS === 'web' ? 40 : 20,
        marginBottom: 100,
    },
    endContent: {
        ...Flex.column,
        marginRight: 10,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 100,
    },
})

export default Messages
