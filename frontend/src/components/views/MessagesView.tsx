import { Colors, Flex, Screens, Spacing } from '../../styles'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchMessages, useGetInfiniteMessages } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'

import ItemSelectionController from '../molecules/ItemSelectionController'
import Loading from '../atoms/Loading'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import Message from '../molecules/Message'
import MessageDetails from '../details/MessageDetails'
import { SectionHeader } from '../molecules/Header'
import { TMessage } from '../../utils/types'
import TaskTemplate from '../atoms/TaskTemplate'
import { useInterval } from '../../utils/hooks'

const Messages = () => {
    const navigate = useNavigate()
    const { refetch: refetchMessages } = useFetchMessages()
    const { data, isLoading, isFetching, fetchNextPage } = useGetInfiniteMessages()

    const params = useParams()
    const [selectedMessage, setSelectedMessage] = useState<TMessage | undefined>(undefined)
    useEffect(() => {
        setSelectedMessage(undefined)
        data?.pages.forEach((page) => {
            page?.forEach((message: TMessage) => {
                if (message.id === params.message) {
                    setSelectedMessage(message)
                }
            })
        })
    }, [params, data])

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

    const messages = data?.pages.flat()

    const expandMessage = useCallback((itemId: string) => navigate(`/messages/${itemId}`), [])

    return (
        <>
            <ScrollView>
                {Platform.OS === 'web' && messages && <ItemSelectionController items={messages} expandItem={expandMessage} />}
                <View style={styles.messagesContent}>
                    <SectionHeader sectionName="Messages" allowRefresh={true} refetch={refetchMessages} />
                    {messages?.map((message: TMessage, msgIndex: number) =>
                        <TaskTemplate
                            ref={msgIndex === messages.length - 1 ? lastElementRef : undefined}
                            style={styles.shell}
                            key={message.id}
                        >
                            <Message message={message} setSheetTaskId={() => null} />
                        </TaskTemplate>
                    )}
                    {(isLoading || isFetching) && <Loading />}
                </View>
            </ScrollView>
            {selectedMessage && <MessageDetails message={selectedMessage} />}
        </>
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
        minWidth: '550px',
    },
    messagesContent: {
        ...Flex.column,
        marginRight: 10,
        marginLeft: 10,
        marginTop: Platform.OS === 'web' ? Spacing.margin.xLarge : Spacing.margin.large,
        marginBottom: 100,
    },
})

export default Messages
