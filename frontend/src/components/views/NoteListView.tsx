import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetNotes } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import { SectionHeader } from '../molecules/Header'
import Note from '../notes/Note'
import NoteCreateButton from '../notes/NoteCreateButton'
import NoteDetails from '../notes/NoteDetails'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const ActionsContainer = styled.div`
    margin-bottom: ${Spacing._16};
`

const NoteListView = () => {
    const { data: notes } = useGetNotes()
    const { noteId } = useParams()
    const navigate = useNavigate()

    const sortedNotes = useMemo(() => {
        if (!notes) return EMPTY_ARRAY
        return notes.sort((a, b) => +DateTime.fromISO(b.updated_at) - +DateTime.fromISO(a.updated_at))
    }, [notes])

    const selectedNote = useMemo(() => {
        if (sortedNotes.length === 0) return null
        return sortedNotes.find((note) => note.id === noteId) ?? sortedNotes[0]
    }, [noteId, notes])

    useEffect(() => {
        if (selectedNote == null) return
        navigate(`/notes/${selectedNote.id}`, { replace: true })
    }, [selectedNote])

    const selectNote = useCallback(
        (note: TNote) => {
            navigate(`/notes/${note.id}`, { replace: true })
            Log(`notes_select_${note.id}`)
        },
        [sortedNotes]
    )

    useItemSelectionController(sortedNotes, selectNote)

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Notes" />
                <ActionsContainer>
                    <NoteCreateButton type="button" />
                </ActionsContainer>
                {!notes ? (
                    <Spinner />
                ) : (
                    <>
                        {sortedNotes.map((note) => (
                            <Note key={note.id} note={note} isSelected={note.id === noteId} onSelect={selectNote} />
                        ))}
                    </>
                )}
            </ScrollableListTemplate>
            {selectedNote ? (
                <NoteDetails note={selectedNote} link={`/notes/${selectedNote.id}`} />
            ) : (
                <EmptyDetails icon={icons.note} text="You have no notes" />
            )}
        </>
    )
}

export default NoteListView
