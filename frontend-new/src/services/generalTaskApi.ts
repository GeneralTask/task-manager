import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getEnvVars from '../environment'
import { TTask, TTaskSection } from '../utils/types'
import type { RootState } from '../redux/store'
const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const generalTaskApi = createApi({
    reducerPath: 'tasks',
    baseQuery: fetchBaseQuery({
        baseUrl: REACT_APP_API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            headers.set('Authorization', 'Bearer ' + (getState() as RootState).user_data.auth_token)
            headers.set('Access-Control-Allow-Origin', REACT_APP_FRONTEND_BASE_URL)
            headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset')
            headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS,GET,PATCH,DELETE')
            headers.set('Timezone-Offset', new Date().getTimezoneOffset().toString())
            return headers
        }
    }),
    endpoints: (builder) => ({
        getTasks: builder.query<TTaskSection[], void>({
            query: () => 'tasks/'
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
                            let section = sections[i]
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
                } catch {
                    result.undo()
                }
            }

        })
    }),
})

export const { useGetTasksQuery, useCreateTaskMutation } = generalTaskApi
