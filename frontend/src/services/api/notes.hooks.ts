import { QueryFunctionContext, useQuery } from 'react-query'
import { AxiosError } from 'axios'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { TNote, TNoteSharedAccess } from '../../utils/types'
import { getBackgroundQueryOptions, useGTMutation, useGTQueryClient } from '../queryUtils'

export interface TCreateNoteData {
    title: string
    body?: string
    author: string
    shared_until?: string
    shared_access?: TNoteSharedAccess
    linked_event_id?: string
    linked_event_start?: string
    linked_event_end?: string
    optimisticId: string
}

export interface TNoteResponse {
    note_id: string
}

export interface TGetNoteParams {
    id: string
}

export interface TModifyNoteData {
    id: string
    title?: string
    body?: string
    shared_until?: string
    shared_access?: TNoteSharedAccess
    is_deleted?: boolean
}

export const useGetNote = (params: TGetNoteParams) => {
    return useQuery<TNote, AxiosError>(['note', params.id], (context) => getNote(params, context), {
        ...getBackgroundQueryOptions(),
        retry: (failureCount, error) => {
            // We don't want to retry the request if the task doesn't exist or if the user is not authorized to access it
            if (error.response?.status === 404) {
                return false
            }
            // 3 is the default retry count
            return failureCount < 3
        },
    })
}
const getNote = async ({ id }: TGetNoteParams, { signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/notes/detail/${id}/`, { signal })
        return castImmutable(res.data)
    } catch (error) {
        throw error as AxiosError
    }
}

export const useGetNotes = (isEnabled = true) => {
    return useQuery<TNote[], void>('notes', getNotes, { enabled: isEnabled, ...getBackgroundQueryOptions() })
}
const getNotes = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/notes/', { signal })
        return castImmutable(res.data)
    } catch {
        throw 'getNotes failed'
    }
}

export const useCreateNote = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()
    return useGTMutation((data: TCreateNoteData) => createNote(data), {
        tag: 'notes',
        invalidateTagsOnSettled: ['notes'],
        errorMessage: 'create note',
        onMutate: async (data: TCreateNoteData) => {
            await queryClient.cancelQueries('notes')
            const notes = queryClient.getImmutableQueryData<TNote[]>('notes')
            if (!notes) return

            const updatedNotes = produce(notes, (draft) => {
                const newNote = createNewNoteHelper(data)
                draft.push(newNote)
            })
            queryClient.setQueryData('notes', updatedNotes)
        },
        onSuccess: async (response: TNoteResponse, createData: TCreateNoteData) => {
            // check response to see if we get anything back for this endpoint
            setOptimisticId(createData.optimisticId, response.note_id)

            const notes = queryClient.getImmutableQueryData<TNote[]>('notes')
            if (!notes) return

            const updatedNotes = produce(notes, (draft) => {
                const note = draft.find((note) => note.id === createData.optimisticId)
                if (!note?.id) return
                note.id = response.note_id
                note.optimisticId = undefined
            })
            queryClient.setQueryData('notes', updatedNotes)
        },
    })
}
export const createNote = async (data: TCreateNoteData) => {
    try {
        const res = await apiClient.post('/notes/create/', data)
        return castImmutable(res.data)
    } catch {
        throw 'createNote failed'
    }
}

export const useModifyNote = () => {
    const queryClient = useGTQueryClient()
    const { getIdFromOptimisticId } = useQueryContext()
    return useGTMutation((data: TModifyNoteData) => modifyNote(data), {
        tag: 'notes',
        invalidateTagsOnSettled: ['notes'],
        errorMessage: 'modify note',
        onMutate: async (data: TModifyNoteData) => {
            await queryClient.cancelQueries('notes')

            const notes = queryClient.getImmutableQueryData<TNote[]>('notes')
            if (!notes) return

            const updatedNotes = produce(notes, (draft) => {
                const note = draft.find((note) => note.id === data.id || note.id === getIdFromOptimisticId(data.id))
                if (!note) return
                note.title = data.title || note.title
                note.body = data.body ?? note.body
                note.shared_until = data.shared_until ?? note.shared_until
                note.shared_access = data.shared_access ?? note.shared_access
                note.updated_at = DateTime.utc().toISO()
                note.is_deleted = data.is_deleted ?? note.is_deleted
            })
            queryClient.setQueryData('notes', updatedNotes)
        },
    })
}
const modifyNote = async (data: TModifyNoteData) => {
    try {
        const res = await apiClient.patch(`/notes/modify/${data.id}/`, data)
        return castImmutable(res.data)
    } catch {
        throw 'modifyNote failed'
    }
}

export const createNewNoteHelper = (
    data: Partial<TNote> & { optimisticId: string; title: string; author: string }
): TNote => {
    return {
        id: data.optimisticId,
        optimisticId: data.optimisticId,
        title: data.title,
        body: data.body ?? '',
        author: data.author,
        created_at: data.created_at ?? DateTime.utc().toISO(),
        updated_at: data.updated_at ?? DateTime.utc().toISO(),
        is_deleted: data.is_deleted ?? false,
        shared_until: data.shared_until,
        shared_access: data.shared_access,
        linked_event_id: data.linked_event_id,
        linked_event_start: data.linked_event_start,
        linked_event_end: data.linked_event_end,
    }
}
