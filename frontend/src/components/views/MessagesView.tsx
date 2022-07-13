import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { SectionHeader } from '../molecules/Header'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchMessages } from '../../services/api/messages.hooks'
import { useGetInfiniteThreads, useModifyThread } from '../../services/api/threads.hooks'
import Loading from '../atoms/Loading'
import Thread from '../molecules/Thread'
import ThreadDetails from '../details/ThreadDetails'
import { Colors, Spacing } from '../../styles'
import ThreadTemplate from '../atoms/ThreadTemplate'
import { DEFAULT_VIEW_WIDTH } from '../../styles/dimensions'
import { TASK_MARK_AS_READ_TIMEOUT } from '../../constants'

const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    padding-bottom: 100px;
    overflow-y: auto;
    margin-right: auto;
    flex-shrink: 0;
    user-select: none;
`
const MessagesContainer = styled.div`
    width: ${DEFAULT_VIEW_WIDTH};
`
const MessageDivider = styled.div<{ transparent?: boolean }>`
    border: 0.5px solid ${(props) => (props.transparent ? 'transparent' : Colors.gray._200)};
    margin-left: ${Spacing.margin._16};
    margin-right: ${Spacing.margin._16};
`

const MessagesView = () => {
    const navigate = useNavigate()
    const params = useParams()
    const { refetch: refetchMessages, isFetching: isFetchingMessages } = useFetchMessages()
    const {
        data,
        isLoading: isLoadingThreads,
        isFetching: isFetchingThreads,
        fetchNextPage,
        refetch: getThreads,
    } = useGetInfiniteThreads({ isArchived: params.mailbox === 'archive' })
    const { mutate: modifyThread } = useModifyThread()
    const sectionScrollingRef = useRef<HTMLDivElement | null>(null)
    const unreadTimer = useRef<NodeJS.Timeout>()

    const threads = useMemo(() => data?.pages.flat().filter((thread) => thread != null) ?? [], [data])
    useItemSelectionController(threads, (itemId: string) => navigate(`/messages/${params.mailbox}/${itemId}`))

    const { expandedThread, expandedIndex } = useMemo(() => {
        if (threads.length > 0) {
            const thread = threads.find((thread) => thread.id === params.thread) ?? threads[0]
            const index = threads.findIndex((thread) => thread.id === params.thread) ?? 0
            return { expandedThread: thread, expandedIndex: index }
        }
        return { expandedThread: undefined, expandedIndex: 0 }
    }, [params.thread, params.mailbox, JSON.stringify(threads)])

    useEffect(() => {
        if (params.mailbox !== 'inbox' && params.mailbox !== 'archive') {
            navigate(`/messages/inbox`)
        } else if (expandedThread) {
            navigate(`/messages/${params.mailbox}/${expandedThread.id}`)
            if (unreadTimer.current) {
                clearTimeout(unreadTimer.current)
            }
            if (expandedThread.emails.some((email) => email.is_unread)) {
                unreadTimer.current = setTimeout(
                    () => modifyThread({ thread_id: expandedThread.id, is_unread: false }),
                    TASK_MARK_AS_READ_TIMEOUT * 1000
                )
            }
        }
    }, [expandedThread, params.mailbox, params.thread])

    const observer = useRef<IntersectionObserver>()
    const lastElementRef = useCallback(
        (node) => {
            if (isLoadingThreads || isFetchingThreads) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && data && data.pages[data.pages.length - 1]?.length > 0) {
                    fetchNextPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isLoadingThreads, isFetchingThreads]
    )

    return (
        <>
            <ScrollViewMimic ref={sectionScrollingRef}>
                <SectionHeader
                    sectionName={params.mailbox === 'inbox' ? 'Inbox' : 'Archive'}
                    allowRefresh={true}
                    refetch={() => {
                        refetchMessages()
                        getThreads()
                    }}
                    isRefreshing={isFetchingMessages || isFetchingThreads}
                />
                <MessagesContainer>
                    {threads.map(
                        (thread, index) =>
                            (params.mailbox === 'archive' || (params.mailbox === 'inbox' && !thread.is_archived)) && (
                                <div key={thread.id}>
                                    <ThreadTemplate ref={index === threads.length - 1 ? lastElementRef : undefined}>
                                        <Thread
                                            thread={thread}
                                            sectionScrollingRef={sectionScrollingRef}
                                            link={`/messages/${params.mailbox}/${thread.id}`}
                                            isSelected={params.thread === thread.id}
                                        />
                                    </ThreadTemplate>
                                    {index !== threads.length - 1 && (
                                        <MessageDivider
                                            transparent={expandedIndex === index || expandedIndex - 1 === index}
                                        />
                                    )}
                                </div>
                            )
                    )}
                </MessagesContainer>
                {(isLoadingThreads || isFetchingThreads) && (
                    <div>
                        <Loading />
                    </div>
                )}
            </ScrollViewMimic>
            {expandedThread && <ThreadDetails thread={expandedThread} />}
        </>
    )
}

export default MessagesView
