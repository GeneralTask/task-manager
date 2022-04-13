import React, { useCallback, useMemo, useRef } from 'react'
import { useFetchMessages, useGetInfiniteMessages } from '../../services/api-query-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import Loading from '../atoms/Loading'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import Message from '../molecules/Message'
import MessageDetails from '../details/MessageDetails'
import { SectionHeader } from '../molecules/Header'
import TaskTemplate from '../atoms/TaskTemplate'
import { useInterval } from '../../utils/hooks'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import styled from 'styled-components'

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
    const { data, isLoading, isFetching, fetchNextPage } = useGetInfiniteMessages()
    useInterval(refetchMessages, MESSAGES_REFETCH_INTERVAL)

    const messages = useMemo(() => data?.pages.flat().filter(message => message != null) ?? [], [data])

    const expandedMessage = useMemo(() => {
        return messages?.find((message) => message.id === params.message)
    }, [params.message, messages])
    useItemSelectionController(messages, (itemId: string) => navigate(`/messages/${itemId}`))

    const observer = useRef<IntersectionObserver>()
    const lastElementRef = useCallback(
        (node) => {
            if (isLoading || isFetching) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) fetchNextPage()
            })
            if (node) observer.current.observe(node)
        }, [isLoading]
    )

    return (
        <>
            <ScrollViewMimic>
                <SectionHeader sectionName="Messages" allowRefresh={true} refetch={refetchMessages} />
                {messages.map((message, index) =>
                    <TaskTemplate
                        ref={index === messages.length - 1 ? lastElementRef : undefined}
                        key={message.id}
                    >
                        <Message message={message} />
                    </TaskTemplate>
                )}
                {(isLoading || isFetching) && <Loading />}
            </ScrollViewMimic>
            {expandedMessage && <MessageDetails message={expandedMessage} />}
        </>
    )
}

export default MessagesView
