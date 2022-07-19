import produce, { castImmutable } from "immer"
import { useInfiniteQuery, useMutation, useQuery } from "react-query"
import { MESSAGES_PER_PAGE } from "../../constants"
import apiClient from "../../utils/api"
import { TEmailThread } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"

interface TModifyThreadData {
    thread_id: string
    is_unread?: boolean
    is_archived?: boolean
}

interface TThreadQueryData {
    pages: TEmailThread[][]
    pageParams: unknown[]
}

export const useGetInfiniteThreads = (data: { isArchived: boolean }) => {
    return useInfiniteQuery<TEmailThread[]>(['emailThreads', { isArchived: data.isArchived }], ({ pageParam = 1 }) => getInfiniteThreads(pageParam, data.isArchived), {
        getNextPageParam: (_, pages) => pages.length + 1,
    })
}
const getInfiniteThreads = async (pageParam: number, isArchived: boolean) => {
    try {
        const res = await apiClient.get(`/threads/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}&is_archived=${isArchived}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getInfiniteThreads failed')
    }
}

export const useGetThreadDetail = (data: { threadId: string }) => {
    return useQuery<TEmailThread>(['emailThreads', data.threadId], () => getThreadDetail(data))
}
const getThreadDetail = async (data: { threadId: string }) => {
    try {
        const res = await apiClient.get(`/threads/detail/${data.threadId}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getThreadDetail failed')
    }
}

export const useModifyThread = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TModifyThreadData) => modifyThread(data), {
        onMutate: async (data: TModifyThreadData) => {
            await queryClient.cancelQueries('emailThreads')
            const queryDataInbox = queryClient.getImmutableQueryData<TThreadQueryData>(['emailThreads', { isArchived: false }])
            const queryDataArchive = queryClient.getImmutableQueryData<TThreadQueryData>(['emailThreads', { isArchived: true }])

            if (!queryDataInbox || !queryDataArchive) return

            const [newQueryDataInbox, newQueryDataArchive] = produce([queryDataInbox, queryDataArchive], (draft) => {
                const [pageInbox, pageArchive] = draft
                for (const page of [...pageInbox.pages, ...pageArchive.pages]) {
                    if (!page) continue
                    for (const thread of page) {
                        if (thread.id === data.thread_id) {
                            if (data.is_archived !== undefined)
                                thread.is_archived = data.is_archived
                            for (const email of thread.emails) {
                                if (data.is_unread !== undefined)
                                    email.is_unread = data.is_unread
                            }
                            break
                        }
                    }
                }
            })

            queryClient.setQueryData(['emailThreads', { isArchived: false }], newQueryDataInbox)
            queryClient.setQueryData(['emailThreads', { isArchived: true }], newQueryDataArchive)
        },
        onSettled: () => {
            queryClient.invalidateQueries(['emailThreads'])
        },
    })
}

const modifyThread = async (data: TModifyThreadData) => {
    try {
        const res = await apiClient.patch(`/threads/modify/${data.thread_id}/`, data)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyThread failed')
    }
}
