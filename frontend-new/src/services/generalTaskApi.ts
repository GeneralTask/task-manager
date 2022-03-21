import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'
import { Platform } from 'react-native'
import { MESSAGES_PER_PAGE } from '../constants'
import getEnvVars from '../environment'
import type { RootState } from '../redux/store'
import { TEvent, TLinkedAccount, TMessage, TSupportedTypes, TTask, TTaskModifyRequestBody, TTaskSection } from '../utils/types'
import { arrayMoveInPlace, resetOrderingIds } from '../utils/utils'


const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const generalTaskApi = createApi({
    reducerPath: 'tasks',
    baseQuery: fetchBaseQuery({
        baseUrl: REACT_APP_API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const authToken = (Platform.OS === 'web' ? Cookies.get('authToken') : (getState() as RootState).user_data.auth_token) as string
            headers.set('Authorization', 'Bearer ' + authToken)
            headers.set('Access-Control-Allow-Origin', REACT_APP_FRONTEND_BASE_URL)
            headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset')
            headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS,GET,PATCH,DELETE')
            headers.set('Timezone-Offset', new Date().getTimezoneOffset().toString())
            return headers
        }
    }),
    tagTypes: ['Tasks', 'Messages', 'Events', 'Accounts'],
    endpoints: (builder) => ({
        getTasksDeprecated: builder.query<TTaskSection[], void>({
            query: () => 'tasks/v3/',
            providesTags: ['Tasks']
        }),
        createTaskDeprecated: builder.mutation<void, { title: string, body: string, id_task_section: string }>({
            query: (data) => ({
                url: 'tasks/create/gt_task/',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            if (section.id === data.id_task_section) {
                                const task: TTask = {
                                    id: '0',
                                    id_ordering: 0,
                                    title: data.title,
                                    body: data.body,
                                    deeplink: '',
                                    sent_at: '',
                                    time_allocated: 0,
                                    due_date: '',
                                    source: {
                                        name: 'General Task',
                                        logo: '',
                                        logo_v2: 'generaltask',
                                        is_completable: false,
                                        is_replyable: false,
                                    },
                                    sender: '',
                                    is_done: false,
                                }
                                section.tasks = [task, ...section.tasks]
                            }
                        }
                    })
                )
                try {
                    await queryFulfilled
                    dispatch(generalTaskApi.util.invalidateTags(['Tasks']))
                } catch {
                    result.undo()
                }
            }
        }),
        modifyTaskDeprecated: builder.mutation<void, { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }>({
            query: (data) => {
                const requestBody: TTaskModifyRequestBody = {}
                if (data.title) requestBody.title = data.title
                if (data.due_date) requestBody.due_date = data.due_date
                if (data.time_duration) requestBody.time_duration = data.time_duration / 1000000
                if (data.body) requestBody.body = data.body
                return {
                    url: `tasks/modify/${data.id}/`,
                    method: 'PATCH',
                    body: requestBody,
                }
            },
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const formattedDate = data.due_date ? new Date(data.due_date).toISOString().slice(0, 10) : ''
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            for (let j = 0; j < section.tasks.length; j++) {
                                const task = section.tasks[j]
                                if (task.id === data.id) {
                                    task.title = data.title || task.title
                                    task.due_date = data.due_date ? formattedDate : task.due_date
                                    task.time_allocated = data.time_duration || task.time_allocated
                                    task.body = data.body || task.body
                                    return
                                }
                            }
                        }
                    })
                )
                try {
                    await queryFulfilled
                    dispatch(generalTaskApi.util.invalidateTags(['Tasks']))

                } catch {
                    result.undo()
                }
            }
        }),
        markTaskDoneDeprecated: builder.mutation<void, { id: string, is_completed: boolean }>({
            query: (data) => ({
                url: `/tasks/modify/${data.id}/`,
                method: 'PATCH',
                body: { is_completed: data.is_completed },
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            for (let j = 0; j < section.tasks.length; j++) {
                                const task = section.tasks[j]
                                if (task.id === data.id) {
                                    task.is_done = data.is_completed
                                    // Don't actually remove tasks from the list, just mark them as done (Until refreshing)
                                    // section.tasks.splice(j, 1)
                                    return
                                }
                            }
                        }
                    })
                )
                try {
                    await queryFulfilled
                } catch {
                    result.undo()
                }
            }
        }),
        reorderTaskDeprecated: builder.mutation<void, { taskId: string, dropSectionId: string, orderingId: number, dragSectionId?: string }>({
            query: ({ taskId, dropSectionId, orderingId }) => ({
                url: `/tasks/modify/${taskId}/`,
                method: 'PATCH',
                body: {
                    id_task_section: dropSectionId,
                    id_ordering: orderingId,
                },
            }),
            invalidatesTags: ['Tasks'],
            onQueryStarted: async ({ taskId, dropSectionId, orderingId, dragSectionId }, { dispatch, queryFulfilled }) => {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections: TTaskSection[]) => {
                        // move task within the same section
                        if (dragSectionId === undefined || dragSectionId === dropSectionId) {
                            const section = sections.find(s => s.id === dropSectionId)
                            if (section == null) return
                            const startIndex = section.tasks.findIndex(t => t.id === taskId)
                            if (startIndex === -1) return
                            let endIndex = orderingId - 1
                            if (startIndex < endIndex) {
                                endIndex -= 1
                            }
                            arrayMoveInPlace(section.tasks, startIndex, endIndex)

                            // update ordering ids
                            resetOrderingIds(section.tasks)
                        }
                        // move task from one section to the other
                        else {
                            // remove task from old location
                            const dragSection = sections.find((section) => section.id === dragSectionId)
                            if (dragSection == null) return
                            const dragTaskIndex = dragSection.tasks.findIndex((task) => task.id === taskId)
                            if (dragTaskIndex === -1) return
                            const dragTask = dragSection.tasks[dragTaskIndex]
                            dragSection.tasks.splice(dragTaskIndex, 1)

                            // add task to new location
                            const dropSection = sections.find((section) => section.id === dropSectionId)
                            if (dropSection == null) return
                            dropSection.tasks.splice(orderingId - 1, 0, dragTask)

                            // update ordering ids
                            resetOrderingIds(dragSection.tasks)
                            resetOrderingIds(dropSection.tasks)
                        }

                    })
                )
                try {
                    await queryFulfilled
                } catch {
                    result.undo()
                }
            }
        }),
        fetchTasksExternalDeprecated: builder.query<void, void>({
            query: () => ({
                url: '/tasks/fetch/',
                method: 'GET',
            }),
        }),
        addTaskSectionDeprecated: builder.mutation<void, { name: string }>({
            query: (data) => ({
                url: 'sections/create/',
                method: 'POST',
                body: { name: data.name },
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections) => {
                        const newSection: TTaskSection = {
                            id: '-1',
                            name: data.name,
                            is_done: false,
                            tasks: [],
                        }
                        sections.splice(sections.length - 1, 0, newSection)
                    })
                )
                try {
                    await queryFulfilled
                    dispatch(generalTaskApi.util.invalidateTags(['Tasks']))
                } catch {
                    result.undo()
                }
            }
        }),
        deleteTaskSectionDeprecated: builder.mutation<void, { id: string }>({
            query: (data) => ({
                url: `sections/delete/${data.id}/`,
                method: 'DELETE',
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            if (section.id === data.id) {
                                sections.splice(i, 1)
                                return
                            }
                        }
                    })
                )
                try {
                    await queryFulfilled
                    dispatch(generalTaskApi.util.invalidateTags(['Tasks']))
                } catch {
                    result.undo()
                }
            }
        }),
        modifyTaskSectionDeprecated: builder.mutation<void, { id: string, name: string }>({
            query: (data) => ({
                url: `sections/modify/${data.id}/`,
                method: 'PATCH',
                body: { name: data.name },
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasksDeprecated', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            if (section.id === data.id) {
                                section.name = data.name
                                return
                            }
                        }
                    })
                )
                try {
                    await queryFulfilled
                    dispatch(generalTaskApi.util.invalidateTags(['Tasks']))
                } catch {
                    result.undo()
                }
            }
        }),
        getMessagesDeprecated: builder.query<TMessage[], { only_unread: boolean, page: number }>({
            query: (data) => ({
                url: 'messages/v2/',
                method: 'GET',
                params: { only_unread: data.only_unread, page: data.page, limit: MESSAGES_PER_PAGE },
            }),
            providesTags: (result) => result ?
                [
                    ...result.map(({ id }) => ({ type: 'Messages' as const, id })),
                    { type: 'Messages', id: 'PARTIAL_LIST' },
                ]
                : [{ type: 'Messages', id: 'PARTIAL_LIST' }],
        }),
        fetchMessagesDeprecated: builder.query<TMessage[], void>({
            query: () => 'messages/fetch/',
            async onQueryStarted(_, { dispatch }) {
                dispatch(generalTaskApi.util.invalidateTags([{ type: 'Messages', id: 'PARTIAL_LIST' }]))
            }
        }),
        markMessageRead: builder.mutation<void, { id: string, is_read: boolean }>({
            query: (data) => ({
                url: `messages/modify/${data.id}/`,
                method: 'PATCH',
                body: { is_read: data.is_read },
            }),
            async onQueryStarted(data, { dispatch }) {
                dispatch(generalTaskApi.util.invalidateTags([{ type: 'Messages', id: data.id }]))
            }
        }),
        markMessageAsTask: builder.mutation<void, { id: string, is_task: boolean }>({
            query: (data) => ({
                url: `messages/modify/${data.id}/`,
                method: 'PATCH',
                body: { is_task: data.is_task },
            }),
            async onQueryStarted(_, { dispatch }) {
                dispatch(generalTaskApi.util.invalidateTags(['Tasks']))
            }
        }),
        getEvents: builder.query<TEvent[], { startISO: string, endISO: string }>({
            query: (data) => ({
                url: 'events/',
                method: 'GET',
                params: {
                    datetime_start: data.startISO,
                    datetime_end: data.endISO,
                },
            }),
        }),
        postFeedback: builder.mutation<void, { feedback: string }>({
            query: (data) => ({
                url: 'feedback/',
                method: 'POST',
                body: { feedback: data.feedback },
            })
        }),
        getLinkedAccounts: builder.query<TLinkedAccount[], void>({
            query: () => ({
                url: 'linked_accounts/',
                method: 'GET',
            }),
            providesTags: ['Accounts']
        }),
        getSupportedTypes: builder.query<TSupportedTypes[], void>({
            query: () => ({
                url: 'linked_accounts/supported_types/',
                method: 'GET',
            }),
        }),
        deleteLinkedAccount: builder.mutation<void, { id: string }>({
            query: (data) => ({
                url: `linked_accounts/${data.id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Accounts']
        }),
    }),
})

export const {
    useGetEventsQuery,
    useGetLinkedAccountsQuery,
    useGetSupportedTypesQuery,
    useDeleteLinkedAccountMutation,
    usePostFeedbackMutation,
    useMarkMessageAsTaskMutation,
} = generalTaskApi
