import { Colors, Flex, Screens, Spacing } from '../../styles'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import React, { useCallback, useRef } from 'react'
import { useFetchMessages, useGetInfiniteMessages } from '../../services/api-query-hooks'

import Loading from '../atoms/Loading'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import Message from '../molecules/Message'
import { SectionHeader } from '../molecules/Header'
import { TMessage } from '../../utils/types'
import TaskTemplate from '../atoms/TaskTemplate'
import { useInterval } from '../../utils/utils'

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

    useInterval(refetchMessages, MESSAGES_REFETCH_INTERVAL)

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
