import React, { useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { MESSAGES_REFETCH_INTERVAL } from '../../constants'
import useItemSelectionController from '../../hooks/useItemSelectionController'
import { useFetchMessages, useGetInfiniteMessages, useGetLinkedAccounts } from '../../services/api-query-hooks'
import { useInterval } from '../../utils/hooks'
import { TMessage } from '../../utils/types'
import Loading from '../atoms/Loading'
import TaskTemplate from '../atoms/TaskTemplate'
import MessageDetails from '../details/MessageDetails'
import { SectionHeader } from '../molecules/Header'
import Message from '../molecules/Message'

const ScrollViewMimic = styled.div`
    margin: 40px 0px 0px 10px;
    padding-right: 10px;
    padding-bottom: 100px;
    overflow: auto;
    flex: 1;
`

const Messages = () => {
    const navigate = useNavigate()
    const { account: accountId, message: messageId } = useParams()
    const { data: linkedAccounts } = useGetLinkedAccounts()
    const currentAccountDisplayId = useMemo(() => {
        const account = linkedAccounts?.find(account => account.id === accountId)
        return account ? account.display_id : null
    }, [accountId, linkedAccounts])

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

    const messages = useMemo(() => data?.pages.flat().filter(message => (message != null && message.source.account_id === currentAccountDisplayId) ?? []), [data])

    const expandedMessage = useMemo(() => {
        return messages?.find((message) => message.id === messageId)
    }, [messageId, messages])

    const expandMessage = useCallback((itemId: string) => navigate(`/messages/${itemId}`), [])

    useItemSelectionController(messages, expandMessage)

    return (
        <>
            <ScrollViewMimic>
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
            </ScrollViewMimic>
            {expandedMessage && <MessageDetails message={expandedMessage} />}
        </>
    )
}

export default Messages
