import produce, { castImmutable } from "immer"
import { useInfiniteQuery, useMutation, useQuery } from "react-query"
import { MESSAGES_PER_PAGE } from "../../constants"
import { DEFAULT_MESSAGE_ID, DEFAULT_SUBJECT, DEFAULT_SENDER } from "../../constants/emailConstants"
import apiClient from "../../utils/api"
import { TMessage, TMeetingBanner, TEmail, TRecipients, TEmailThread } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"

interface TMessageFetchData {
    refresh_required: boolean
}

interface TMarkMessageReadData {
    id: string
    isRead: boolean
}

interface TComposeMessageData {
    message_id?: string
    subject?: string
    body: string
    recipients: TRecipients
    source_id: string
    source_account_id: string
}

interface TEmailThreadResponse {
    pages: TEmailThread[][]
}

export const useGetInfiniteMessages = () => {
    return useInfiniteQuery<TMessage[], void>('messages', getInfiniteMessages, {
        getNextPageParam: (_, pages) => pages.length + 1,
    })
}
const getInfiniteMessages = async ({ pageParam = 1 }) => {
    try {
        const res = await apiClient.get(`/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getInfiniteMessages failed')
    }
}

export const useFetchMessages = () => {
    const queryClient = useGTQueryClient()
    return useQuery<TMessageFetchData>('messagesFetch', () => fetchMessages(), {
        onSettled: (data) => {
            if (data?.refresh_required) {
                queryClient.invalidateQueries('messagesFetch')
            }

            queryClient.invalidateQueries('emailThreads')
        },
    })
}
const fetchMessages = async () => {
    try {
        const res = await apiClient.get('/messages/fetch/')
        return castImmutable(res.data)
    } catch {
        throw new Error('fetchMessages failed')
    }
}

export const useMeetingBanner = () => {
    return useQuery<TMeetingBanner>('meeting_banner', () => meetingBanner())
}
const meetingBanner = async () => {
    try {
        const res = await apiClient.get('/meeting_banner/')
        return castImmutable(res.data)
    } catch {
        throw new Error('useMeetingBanner failed')
    }
}

export const useMarkMessageRead = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TMarkMessageReadData) => markMessageRead(data), {
        onSettled: (_, error, variables) => {
            if (error) return
            queryClient.invalidateQueries(['messages', variables.id])
        },
    })
}
const markMessageRead = async (data: TMarkMessageReadData) => {
    try {
        const res = await apiClient.patch(`/messages/modify/${data.id}/`, { is_read: data.isRead })
        return castImmutable(res.data)
    } catch {
        throw new Error('markMessageRead failed')
    }
}

export const useComposeMessage = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TComposeMessageData) => composeMessage(data), {
        onMutate: async (data: TComposeMessageData) => {
            // if message is part of a thread
            if (!data.message_id) return

            await queryClient.cancelQueries('emailThreads')

            const response = queryClient.getImmutableQueryData<TEmailThreadResponse>('emailThreads')
            if (!response) return

            const tempEmail: TEmail = {
                message_id: DEFAULT_MESSAGE_ID,
                subject: data.subject || DEFAULT_SUBJECT,
                body: data.body,
                sent_at: new Date().toISOString(),
                is_unread: false,
                sender: {
                    name: DEFAULT_SENDER,
                    email: data.source_account_id,
                    reply_to: '',
                },
                recipients: data.recipients,
                num_attachments: 0
            }

            const newResponse = produce(response, (draft) => {
                const thread = draft.pages.flat().find(
                    thread => thread.emails.find(
                        email => email.message_id === data.message_id
                    ) !== null
                )
                if (!thread) return

                thread.emails.push(tempEmail)
            })


            queryClient.setQueryData('emailThreads', newResponse)
        },
        onSettled: async () => {
            await fetchMessages()
            queryClient.invalidateQueries('emailThreads')
        }
    })
}
const composeMessage = async (data: TComposeMessageData) => {
    try {
        const res = await apiClient.post(`/messages/compose/`, data)
        return castImmutable(res.data)
    } catch {
        throw new Error('composeMessage failed')
    }
}
