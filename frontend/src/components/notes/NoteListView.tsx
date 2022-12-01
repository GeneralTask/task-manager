import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetNotes } from '../../services/api/notes.hooks'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import Note from './Note'
import NoteDetails from './NoteDetails'

const NoteListView = () => {
    const { data: notes } = useGetNotes()
    const { noteId } = useParams()
    const navigate = useNavigate()

    const selectedNote = useMemo(() => {
        if (notes == null || notes.length === 0) return null
        return notes.find((note) => note.id === noteId) ?? notes[0]
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
                {!notes ? (
                    <Spinner />
                ) : (
                    <>
                        {/* <AddNote /> */}
                        {notes.map((note) => (
                            <Note key={note.id} note={note} isSelected={note.id === noteId} onSelect={selectNote} />
                        ))}
                    </>
                )}
            </ScrollableListTemplate>
            {/* <EmptyDetails icon={icons.note} text="You have no notes sadge" /> */}
            {selectedNote ? (
                <NoteDetails note={selectedNote} link={`/notes/${selectedNote.id}`} />
            ) : (
                <EmptyDetails icon={icons.note} text="You have no notes sadge" />
            )}
        </>
    )
}

export default NoteListView
