import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getEnvVars from '../environment'
import { TTask, TTaskSection } from '../utils/types'
import type { RootState } from '../redux/store'
import Cookies from 'js-cookie'
import { Platform } from 'react-native'
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
    tagTypes: ['Tasks'],
    endpoints: (builder) => ({
        getTasks: builder.query<TTaskSection[], void>({
            query: () => 'tasks/',
            providesTags: ['Tasks']
        }),
        createTask: builder.mutation<void, { title: string, body: string, id_task_section: string }>({
            query: (data) => ({
                url: 'tasks/create/gt_task/',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasks', undefined, (sections) => {
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
        modifyTask: builder.mutation<void, { body: string, id: string }>({
            query: (data) => ({
                url: `tasks/modify/${data.id}/`,
                method: 'PATCH',
                body: { body: data.body },
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasks', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            for (let j = 0; j < section.tasks.length; j++) {
                                const task = section.tasks[j]
                                if (task.id === data.id) {
                                    task.body = data.body
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
        markTaskDone: builder.mutation<void, { id: string, is_completed: boolean }>({
            query: (data) => ({
                url: `/tasks/modify/${data.id}/`,
                method: 'PATCH',
                body: { is_completed: data.is_completed },
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasks', undefined, (sections) => {
                        for (let i = 0; i < sections.length; i++) {
                            const section = sections[i]
                            for (let j = 0; j < section.tasks.length; j++) {
                                const task = section.tasks[j]
                                if (task.id === data.id) {
                                    task.is_done = data.is_completed
                                    if (data.is_completed) section.tasks.splice(j, 1)
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
        addTaskSection: builder.mutation<void, { name: string }>({
            query: (data) => ({
                url: 'sections/create/',
                method: 'POST',
                body: { name: data.name },
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasks', undefined, (sections) => {
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
        deleteTaskSection: builder.mutation<void, { id: string }>({
            query: (data) => ({
                url: `sections/delete/${data.id}/`,
                method: 'DELETE',
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                const result = dispatch(
                    generalTaskApi.util.updateQueryData('getTasks', undefined, (sections) => {
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
    }),
})

export const { useGetTasksQuery, useModifyTaskMutation, useCreateTaskMutation, useMarkTaskDoneMutation, useAddTaskSectionMutation, useDeleteTaskSectionMutation } = generalTaskApi
