import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { SectionHeader } from '../molecules/Header'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchMessages, useGetInfiniteThreads } from '../../services/api-query-hooks'
import Loading from '../atoms/Loading'
import Thread from '../molecules/Thread'
import ThreadDetails from '../details/ThreadDetails'
import { Border, Colors, Spacing } from '../../styles'
import ThreadTemplate from '../atoms/ThreadTemplate'

const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    padding-bottom: 100px;
    overflow-y: auto;
    margin-right: auto;
    flex-shrink: 0;
`
const MessagesContainer = styled.div`
    border-radius: ${Border.radius.large};
    background-color: ${Colors.gray._100};
    width: 480px;
`
const MessageDivider = styled.div`
    border-bottom: 1px solid ${Colors.gray._200};
    margin-top: ${Spacing.margin._4}px;
    margin-left: ${Spacing.margin._16}px;
    margin-right: ${Spacing.margin._16}px;
`

const MessagesView = () => {
    const navigate = useNavigate()
    const params = useParams()
    const { refetch: refetchMessages, isFetching: isRefetchingMessages } = useFetchMessages()
    const {
        data,
        isLoading: isLoadingThreads,
        isFetching: isFetchingThreads,
        fetchNextPage,
        refetch: getThreads,
    } = useGetInfiniteThreads()
    const sectionScrollingRef = useRef<HTMLDivElement | null>(null)

    const threads = useMemo(() => data?.pages.flat().filter((thread) => thread != null) ?? [], [data])
    useItemSelectionController(threads, (itemId: string) => navigate(`/messages/${itemId}`))

    const expandedThread = useMemo(() => {
        if (threads.length > 0) {
            return threads.find((thread) => thread.id === params.thread) ?? threads[0]
        }
        return undefined
    }, [params.thread, threads])

    useEffect(() => {
        if (expandedThread) {
            navigate(`/messages/${expandedThread.id}`)
        }
    }, [expandedThread])

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
                    sectionName="Messages"
                    allowRefresh={true}
                    refetch={() => {
                        refetchMessages()
                        getThreads()
                    }}
                    isRefetching={isRefetchingMessages || isFetchingThreads}
                />
                <MessagesContainer>
                    {threads.map((thread, index) => (
                        <div key={thread.id}>
                            <ThreadTemplate ref={index === threads.length - 1 ? lastElementRef : undefined}>
                                <Thread thread={thread} sectionScrollingRef={sectionScrollingRef} />
                            </ThreadTemplate>
                            {index !== threads.length - 1 && <MessageDivider />}
                        </div>
                    ))}
                </MessagesContainer>
                {(isLoadingThreads || isFetchingThreads) && (
                    <div>
                        <Loading />
                    </div>
                )}
            </ScrollViewMimic>
            {<ThreadDetails thread={expandedThread} />}
        </>
    )
}

export default MessagesView
