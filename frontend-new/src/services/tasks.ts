import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getEnvVars from '../environment'
import { TTaskSection } from '../utils/types'
import type { RootState } from '../redux/store'
const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const tasksApi = createApi({
    reducerPath: 'tasks',
    baseQuery: fetchBaseQuery({
        baseUrl: REACT_APP_API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            headers.set('Authorization', 'Bearer ' + (getState() as RootState).user_data.auth_token)
            headers.set('Access-Control-Allow-Origin', REACT_APP_FRONTEND_BASE_URL)
            headers.set('Access-Control-Allow-Headers', 'Authorization')
            headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS,GET,PATCH,DELETE')
            headers.set('Timezone-Offset', new Date().getTimezoneOffset().toString())
            return headers
        }
    }),
    endpoints: (builder) => ({
        getTasks: builder.query<TTaskSection[], void>({
            query: () => 'tasks/'
        }),
    }),
})

export const { useGetTasksQuery } = tasksApi
