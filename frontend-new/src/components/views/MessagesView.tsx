import React, { useCallback, useEffect, useRef } from 'react'
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MESSAGES_PER_PAGE } from '../../constants'
import { useFetchMessagesQuery, useGetMessagesQuery } from '../../services/generalTaskApi'
import { Colors, Flex, Screens, Shadows } from '../../styles'
import { TMessage } from '../../utils/types'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import { SectionHeader } from '../molecules/Header'
import Message from '../molecules/Message'

// type TPageMap = { [key: number]: TMessage[] }
type TPageArray = TMessage[][]

const Messages = () => {
    // const [currentPage, setCurrentPage] = useState(1)
    const currentPageRef = useRef(1)
    const {
        data: messages,
        isLoading,
        refetch,
        isFetching,
    } = useGetMessagesQuery({ only_unread: false, page: currentPageRef.current })
    // const [atEnd, setAtEnd] = useState(false)
    const atEndRef = useRef(false)
    // const [pages, setPages] = useState<TPageArray>([])
    const pagesRef = useRef<TPageArray>([])
    const { refetch: fetchMessages } = useFetchMessagesQuery()
    const refetchWasLocal = useRef(false)

    const isLoadingRef = useRef(isLoading)

    useEffect(() => {
        isLoadingRef.current = isLoading
    }, [isLoading])

    useEffect(() => {
        console.log(messages)
        console.log(pagesRef.current)
    })

    const observer = useRef<IntersectionObserver>()

    const bottomOfPageRef = useCallback(
        (node) => {
            if (isLoading) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !atEndRef.current) {
                    currentPageRef.current++
                    refetch()
                }
            })
            if (node) observer.current.observe(node)
        },
        [atEndRef.current]
    )

    //stops fetching animation on iOS from triggering when refetch is called in another component
    if (!isFetching) refetchWasLocal.current = false
    const onRefresh = () => {
        refetchWasLocal.current = true
        refetch()
    }
    // Refetches messages every 30 seconds
    // useEffect(() => {
    //     const interval = setInterval(() => fetchMessages(), 30000)
    //     return () => clearInterval(interval)
    // }, [])

    useEffect(() => {
        if (messages && !atEndRef.current) {
            console.log('passed first if')
            console.log('messages init', messages)
            if (messages.length < MESSAGES_PER_PAGE) {
                atEndRef.current = true
            }
            // setPages({ ...pages, [currentPageRef.current]: messages })
            pagesRef.current[currentPageRef.current] = messages
        } else if (messages && atEndRef.current) {
            atEndRef.current = false
            // setPages([])
            pagesRef.current = []
            console.log('RESET CURRENT PAGE') //TODO: remove
            currentPageRef.current = 1
        }
    }, [messages])

    // useEffect(() => {
    //     console.log(currentPageRef.current)
    //     let observer = new IntersectionObserver(
    //         ([entry]) => {
    //             console.log('checking for intersection') //TODO: remove
    //             if (entry.isIntersecting && !isFetching && !refetchWasLocal.current && !atEndRef.current) {
    //                 console.log('intersection detected') //TODO: remove
    //                 console.log('current page is currently', currentPageRef.current) //TODO: remove
    //                 currentPageRef.current = currentPageRef.current + 1
    //                 refetch()
    //             }
    //         }
    //     )
    //     if (bottomOfPageRef.current) {
    //         observer.observe(bottomOfPageRef.current)
    //     }
    //     return () => observer.disconnect()
    // }, [bottomOfPageRef.current])

    const refreshControl = <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />

    const messagesArray: JSX.Element[] = []
    pagesRef.current.map((messages, i) => {
        return messages.map((msg, j) => {
            if (i === pagesRef.current.length - 1 && j === messages.length - 1) {
                messagesArray.push(
                    <TaskTemplate style={styles.shell} key={msg.id} ref={bottomOfPageRef}>
                        <Message message={msg} setSheetTaskId={() => null} />
                    </TaskTemplate>
                )
            } else {
                messagesArray.push(
                    <TaskTemplate style={styles.shell} key={msg.id}>
                        <Message message={msg} setSheetTaskId={() => null} />
                    </TaskTemplate>
                )
            }
        })
    })

    return (
        <ScrollView style={styles.container} refreshControl={refreshControl}>
            <View style={styles.messagesContent}>
                {isLoading ? (
                    <Loading />
                ) : (
                    <View>
                        <SectionHeader section="Messages" allowRefresh={true} refetch={refetch} />
                        {messagesArray}
                        <Text style={styles.endContent}>
                            {atEndRef.current ? `You've reached the bottom` : `Loading...`}
                        </Text>
                    </View>
                )}
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
