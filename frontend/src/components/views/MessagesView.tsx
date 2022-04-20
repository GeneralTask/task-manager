import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import { SectionHeader } from '../molecules/Header'
import { useInterval } from '../../hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchMessages, useGetInfiniteThreads } from '../../services/api-query-hooks'
import Loading from '../atoms/Loading'
import Thread from '../molecules/Thread'
import ThreadDetails from '../details/ThreadDetails'
import { setSelectedItemId } from '../../redux/tasksPageSlice'
import { useAppDispatch } from '../../redux/hooks'
import { Border, Colors, Spacing } from '../../styles'
import ThreadTemplate from '../atoms/ThreadTemplate'

const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    padding-bottom: 100px;
    overflow: auto;
    flex: 1;
`
const MessagesContainer = styled.div`
    border-radius: ${Border.radius.large};
    background-color: ${Colors.gray._100};
`
const MessageDivider = styled.div`
    border-bottom: 1px solid ${Colors.gray._200};
    margin-top: ${Spacing.margin._4}px;
    margin-left: ${Spacing.margin._16}px;
    margin-right: ${Spacing.margin._16}px;
`

const MessagesView = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const params = useParams()
    const { refetch: refetchMessages } = useFetchMessages()
    const { data, isLoading, isFetching, fetchNextPage } = useGetInfiniteThreads()
    useInterval(refetchMessages, MESSAGES_REFETCH_INTERVAL)

    const threads = useMemo(() => data?.pages.flat().filter((thread) => thread != null) ?? [], [data])
    useItemSelectionController(threads, (itemId: string) => navigate(`/messages/${itemId}`))

    const expandedThread = useMemo(() => {
        if (threads.length > 0) {
            return threads.find((thread) => thread.id === params.thread) ?? threads[0]
        }
        return undefined
    }, [params.thread, threads])

    useLayoutEffect(() => {
        if (expandedThread) {
            dispatch(setSelectedItemId(expandedThread.id))
        }
    }, [expandedThread])

    const observer = useRef<IntersectionObserver>()
    const lastElementRef = useCallback(
        (node) => {
            if (isLoading || isFetching) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && data && data.pages[data.pages.length - 1]?.length > 0) {
                    fetchNextPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isLoading, isFetching]
    )

    return (
        <>
            <ScrollViewMimic>
                <SectionHeader sectionName="Messages" allowRefresh={true} refetch={refetchMessages} />
                <MessagesContainer>
                    {threads.map((thread, index) => (
                        <>
                            <ThreadTemplate
                                ref={index === threads.length - 1 ? lastElementRef : undefined}
                                key={thread.id}
                            >
                                <Thread thread={thread} />
                            </ThreadTemplate>
                            {index !== threads.length - 1 && <MessageDivider />}
                        </>
                    ))}
                </MessagesContainer>
                {(isLoading || isFetching) && (
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
