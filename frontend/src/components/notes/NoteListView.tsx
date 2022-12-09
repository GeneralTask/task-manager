import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import Note from './Note'
import NoteCreateButton from './NoteCreateButton'
import NoteDetails from './NoteDetails'

const ActionsContainer = styled.div`
    margin-bottom: ${Spacing._16};
`

const NoteListView = () => {
    const { data: notes } = useGetNotes()
    const { noteId } = useParams()
    const navigate = useNavigate()

    const selectedNote = useMemo(() => {
        if (notes == null || notes.length === 0) return null
        return notes.find((note) => note.id === noteId) ?? notes[notes.length - 1]
    }, [noteId, notes])

    useEffect(() => {
        if (selectedNote == null) return
        navigate(`/notes/${selectedNote.id}`, { replace: true })
    }, [selectedNote])

    const selectNote = useCallback((note: TNote) => {
        navigate(`/notes/${note.id}`)
        Log(`notes_select_${note.id}`)
    }, [])

    useItemSelectionController(notes ?? EMPTY_ARRAY, selectNote)

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
                        {/* temporarily reversing notes so that the most recent note is at the top (backend will change to be correct soon) */}
                        {[...notes].reverse().map((note) => (
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
