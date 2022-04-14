import React, { useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchMessages, useGetInfiniteThreads } from '../../services/api-query-hooks'
import { useInterval } from '../../utils/hooks'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import ThreadDetails from '../details/ThreadDetails'
import { SectionHeader } from '../molecules/Header'
import Thread from '../molecules/Thread'

const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    padding-bottom: 100px;
    overflow: auto;
    flex: 1;
`

const MessagesView = () => {
    const navigate = useNavigate()
    const params = useParams()
    const { refetch: refetchMessages } = useFetchMessages()
    const { data, isLoading, isFetching, fetchNextPage } = useGetInfiniteThreads()
    useInterval(refetchMessages, MESSAGES_REFETCH_INTERVAL)

    const threads = useMemo(() => data?.pages.flat().filter((thread) => thread != null) ?? [], [data])

    const expandedThread = useMemo(() => {
        if (threads.length > 0) {
            return threads.find((thread) => thread.id === params.thread) ?? threads[0]
        }
        return undefined
    }, [params.thread, threads])
    useItemSelectionController(threads, (itemId: string) => navigate(`/messages/${itemId}`))

    const observer = useRef<IntersectionObserver>()
    const lastElementRef = useCallback(
        (node) => {
            if (isLoading || isFetching) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) fetchNextPage()
            })
            if (node) observer.current.observe(node)
        },
        [isLoading]
    )

    return (
        <>
            <ScrollViewMimic>
                <SectionHeader sectionName="Messages" allowRefresh={true} refetch={refetchMessages} />
                {threads.map((thread, index) => (
                    <TaskTemplate
                        ref={index === threads.length - 1 ? lastElementRef : undefined}
                        lines={3}
                        key={thread.id}
                    >
                        <Thread thread={thread} />
                    </TaskTemplate>
                ))}
                {(isLoading || isFetching) && <Loading />}
            </ScrollViewMimic>
            {<ThreadDetails thread={expandedThread} />}
        </>
    )
}

export default MessagesView
