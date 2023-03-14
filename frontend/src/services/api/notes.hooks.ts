import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { SharedAccess } from '../../utils/enums'
import { TNote } from '../../utils/types'
import { getBackgroundQueryOptions, useGTMutation, useGTQueryClient } from '../queryUtils'

export interface TCreateNoteData {
    title: string
    body?: string
    author: string
    shared_until?: string
    shared_access?: SharedAccess
    linked_event_id?: string
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
    is_deleted?: boolean
}

export const useGetNote = (params: TGetNoteParams) => {
    return useQuery<TNote>(['note', params.id], (context) => getNote(params, context), getBackgroundQueryOptions())
}
const getNote = async ({ id }: TGetNoteParams, { signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get(`/notes/detail/${id}/`, { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getNote failed')
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
        throw new Error('getNotes failed')
    }
}

export const useCreateNote = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()
    return useGTMutation((data: TCreateNoteData) => createNote(data), {
        tag: 'notes',
        errorMessage: 'create note',
        invalidateTagsOnSettled: ['notes'],
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
        const res = await apiClient.post('/notes/create/', {
            title: data.title,
            body: data.body,
            author: data.author,
            shared_until: data.shared_until,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('createNote failed')
    }
}

export const useModifyNote = () => {
    const queryClient = useGTQueryClient()
    const { getIdFromOptimisticId } = useQueryContext()
    return useGTMutation((data: TModifyNoteData) => modifyNote(data), {
        tag: 'notes',
        errorMessage: 'modify note',
        invalidateTagsOnSettled: ['notes'],
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
        throw new Error('modifyNote failed')
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
    }
}
