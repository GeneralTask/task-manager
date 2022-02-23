import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import getEnvVars from '../environment'
import type { RootState } from '../redux/store'
import { TEvent } from '../utils/types'

const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const eventsApi = createApi({
    reducerPath: 'events',
    baseQuery: fetchBaseQuery({
        baseUrl: REACT_APP_API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            headers.set('Authorization', 'Bearer ' + (getState() as RootState).user_data.auth_token)
            headers.set('Access-Control-Allow-Origin', REACT_APP_FRONTEND_BASE_URL)
            headers.set('Access-Control-Allow-Headers', 'Authorization')
            headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS,GET,PATCH,DELETE')
            headers.set('Timezone-Offset', new Date().getTimezoneOffset().toString())
            headers.set('datetime_start', datetime_start.toISOString())
            headers.set('datetime_end', datetime_end.toISOString())
            return headers
        }
    }),
    endpoints: (builder) => ({
        getEvents: builder.query<TEvent[], void>({
            query: () => 'events/',
        }),
    }),
})

export const { useGetEventsQuery } = eventsApi
