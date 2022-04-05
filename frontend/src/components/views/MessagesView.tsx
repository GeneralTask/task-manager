import { Colors, Flex, Screens, Spacing } from '../../styles'
import React, { useCallback, useMemo, useRef } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useFetchMessages, useGetInfiniteMessages } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'

import Loading from '../atoms/Loading'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import Message from '../molecules/Message'
import MessageDetails from '../details/MessageDetails'
import { SectionHeader } from '../molecules/Header'
import { TMessage } from '../../utils/types'
import TaskTemplate from '../atoms/TaskTemplate'
import { useInterval } from '../../utils/hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'

const Messages = () => {
    const navigate = useNavigate()
    const params = useParams()
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
    useInterval(refetchMessages, MESSAGES_REFETCH_INTERVAL)

    const messages = useMemo(() => data?.pages.flat().filter(message => message != null) ?? [], [data])

    const expandedMessage = useMemo(() => {
        return messages?.find((message) => message.id === params.message)
    }, [params.message, messages])

    const expandMessage = useCallback((itemId: string) => navigate(`/messages/${itemId}`), [])

    useItemSelectionController(messages, expandMessage)

    return (
        <>
            <ScrollView>
                <View style={styles.messagesContent}>
                    <SectionHeader sectionName="Messages" allowRefresh={true} refetch={refetchMessages} />
                    {messages?.map((message: TMessage, msgIndex: number) =>
                        <TaskTemplate
                            ref={msgIndex === messages.length - 1 ? lastElementRef : undefined}
                            key={message.id}
                        >
                            <Message message={message} />
                        </TaskTemplate>
                    )}
                    {(isLoading || isFetching) && <Loading />}
                </View>
            </ScrollView>
            {expandedMessage && <MessageDetails message={expandedMessage} />}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Screens.container,
        ...Flex.column,
        paddingTop: 0,
        backgroundColor: Colors.gray._50,
        minWidth: '550px',
    },
    messagesContent: {
        ...Flex.column,
        marginRight: 10,
        marginLeft: 10,
        marginTop: Spacing.margin._40,
        marginBottom: 100,
    },
})

export default Messages
