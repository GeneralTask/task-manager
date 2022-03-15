import React, { useCallback, useRef } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { MESSAGES_PER_PAGE } from '../../constants'
import { Colors, Flex, Screens, Shadows } from '../../styles'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import { SectionHeader } from '../molecules/Header'
import Message from '../molecules/Message'
import { useInfiniteQuery } from 'react-query'
import getEnvVars from '../../environment'
import Cookies from 'js-cookie'
import { TMessage } from '../../utils/types'
const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

//move to separate utils file
const fetchInfiniteMessages = async ({ pageParam = 1 }) => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${Cookies.get('authToken')}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        },
    })
    return res.json()
}

const Messages = () => {
    const { data, isLoading, isFetching, fetchNextPage, refetch } = useInfiniteQuery(
        'messages',
        fetchInfiniteMessages,
        {
            getNextPageParam: (_, pages) => pages.length + 1,
        }
    )

    const observer = useRef<IntersectionObserver>()
    const lastElement = useCallback(
        (node) => {
            if (isLoading) return
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

    return (
        <ScrollView>
            <View style={styles.messagesContent}>
                <SectionHeader section="Messages" allowRefresh={true} refetch={refetch} />
                {data?.pages.map((page, index) => {
                    return page?.map((message: TMessage, msgIndex: number) => {
                        if (data.pages.length === index + 1 && page.length === msgIndex + 1) {
                            return (
                                <TaskTemplate ref={lastElement} style={styles.shell} key={message.id}>
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
        marginTop: 20,
        ...Shadows.small,
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
