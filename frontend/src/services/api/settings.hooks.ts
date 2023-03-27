import { QueryFunctionContext, useMutation, useQuery } from 'react-query'
import * as Sentry from '@sentry/browser'
import produce, { castImmutable } from 'immer'
import { useSetting } from '../../hooks'
import apiClient from '../../utils/api'
import { TCalendarAccount, TLinkedAccount, TSetting, TSupportedType } from '../../utils/types'
import { useGTMutation, useGTQueryClient } from '../queryUtils'

export type GHSortPreference = `${string}github_sorting_preference${string}`
export type GHSortDirection = `${string}github_sorting_direction${string}`
export type GHFilterPreference = `${string}github_filtering_preference${string}`

export type TaskSortPreference = `${string}task_sorting_preference${string}`
export type TaskSortDirection = `${string}task_sorting_direction${string}`
export type TaskFilterPreference = `${string}task_filtering_preference${string}`

export type NoteSortPreference = `${string}note_sorting_preference${string}`
export type NoteSortDirection = `${string}note_sorting_direction${string}`
export type NoteFilterPreference = `${string}note_filtering_preference${string}`

export type LinearSortPreference = `${string}linear_task_sorting_preference${string}`
export type LinearSortDirection = `${string}linear_task_sorting_direction${string}`
export type LinearFilterPreference = `${string}linear_task_filtering_preference${string}`

export type TSettingsKey =
    | 'calendar_account_id_for_new_tasks'
    | 'calendar_calendar_id_for_new_tasks'
    | GHFilterPreference
    | GHSortPreference
    | GHSortDirection
    | TaskSortPreference
    | TaskSortDirection
    | TaskFilterPreference
    | NoteSortPreference
    | NoteSortDirection
    | NoteFilterPreference
    | LinearSortPreference
    | LinearSortDirection
    | LinearFilterPreference
    | 'sidebar_linear_preference'
    | 'sidebar_github_preference'
    | 'sidebar_slack_preference'
    | 'sidebar_jira_preference'
    | 'has_dismissed_multical_prompt'
    | 'leaderboard_github_repository_id'

type TUpdateSettingsData = {
    key: TSettingsKey
    value: string
}

export const useGetSettings = () => {
    return useQuery<TSetting[]>('settings', getSettings)
}
const getSettings = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/settings/', { signal })
        const settings: TSetting[] = res.data
        // temporarily mock this setting
        return castImmutable([
            ...settings,
            {
                field_key: 'calendar_calendar_id_for_new_tasks',
                field_value:
                    settings.find((s) => s.field_key === 'calendar_account_id_for_new_tasks')?.field_value || '',
                field_name: '',
                choices: [],
            },
        ]) as TSetting[]
    } catch {
        throw 'getSettings failed'
    }
}

export const useUpdateSetting = () => {
    const queryClient = useGTQueryClient()
    return useMutation(updateSettings, {
        onMutate: async ({ key, value }) => {
            await queryClient.cancelQueries('settings')
            const settings = queryClient.getQueryData<TSetting[]>('settings')
            if (!settings) return

            const newSettings = produce(settings, (draft) => {
                const setting = draft.find((setting) => setting.field_key === key)
                if (setting) setting.field_value = value
                else {
                    Sentry.captureMessage(`Setting ${key} not found`)
                }
            })
            queryClient.setQueryData('settings', newSettings)
        },
        onSettled: () => {
            queryClient.invalidateQueries('settings')
        },
    })
}
const updateSettings = async (data: TUpdateSettingsData) => {
    try {
        await apiClient.patch('/settings/', { [data.key]: data.value })
    } catch {
        throw 'updateSettings failed'
    }
}

export const useGetLinkedAccounts = () => {
    return useQuery<TLinkedAccount[]>('linked_accounts', getLinkedAccounts)
}
const getLinkedAccounts = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/linked_accounts/', { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getLinkedAccounts failed'
    }
}

export const useGetSupportedTypes = () => {
    return useQuery<TSupportedType[]>('supported_types', getSupportedTypes)
}
const getSupportedTypes = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/linked_accounts/supported_types/', { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getSupportedTypes failed'
    }
}

export const useDeleteLinkedAccount = () => {
    const queryClient = useGTQueryClient()
    const {
        field_value: taskToCalAccount,
        updateSetting: setTaskToCalAccount,
        choices: taskToCalAccountChoices,
    } = useSetting('calendar_account_id_for_new_tasks')
    const { updateSetting: setTaskToCalCalendar } = useSetting('calendar_calendar_id_for_new_tasks')

    return useGTMutation(deleteLinkedAccount, {
        tag: 'linked_accounts',
        invalidateTagsOnSettled: ['linked_accounts', 'calendars', 'events', 'settings'],
        errorMessage: 'delete account',
        onMutate: ({ id }: { id: string }) => {
            const linkedAccounts = queryClient.getQueryData<TLinkedAccount[]>('linked_accounts')
            const calendars = queryClient.getQueryData<TCalendarAccount[]>('calendars')

            const linkedAccountIdx = linkedAccounts?.findIndex((linkedAccount) => linkedAccount.id === id)
            if (linkedAccountIdx === -1 || linkedAccountIdx === undefined || !linkedAccounts) return

            const newLinkedAccounts = produce(linkedAccounts, (draft) => {
                draft.splice(linkedAccountIdx, 1)
            })
            queryClient.setQueryData('linked_accounts', newLinkedAccounts)

            if (calendars) {
                const newCalendars = produce(calendars, (draft) => {
                    const calendarIdx = draft.findIndex(
                        (calendar) => calendar.account_id === linkedAccounts[linkedAccountIdx].display_id
                    )
                    if (calendarIdx === -1) return
                    draft.splice(calendarIdx, 1)
                })
                queryClient.setQueryData('calendars', newCalendars)
            }

            if (taskToCalAccount === linkedAccounts[linkedAccountIdx].display_id) {
                const newAccount = taskToCalAccountChoices.find(
                    (choice) => choice.choice_key !== linkedAccounts[linkedAccountIdx].display_id
                )
                if (!newAccount) return
                setTaskToCalAccount(newAccount.choice_key)
                setTaskToCalCalendar(newAccount.choice_key)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries('linked_accounts')
            queryClient.invalidateQueries('calendars')
            queryClient.invalidateQueries('events')
        },
    })
}
const deleteLinkedAccount = async (data: { id: string }) => {
    try {
        const res = await apiClient.delete(`/linked_accounts/${data.id}/`)
        return castImmutable(res.data)
    } catch {
        throw 'deleteLinkedAccount failed'
    }
}
