import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetNotes } from '../../services/api/notes.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import SortAndFilterSelectors from '../../utils/sortAndFilter/SortAndFilterSelectors'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { TNote } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import { SectionHeader } from '../molecules/Header'
import Note from '../notes/Note'
import NoteCreateButton from '../notes/NoteCreateButton'
import NoteDetails from '../notes/NoteDetails'
import { NOTE_SORT_AND_FILTER_CONFIG } from '../notes/note.config'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const ActionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    margin-bottom: ${Spacing._16};
`

const NoteListView = () => {
    const { data: notes } = useGetNotes()
    const { noteId } = useParams()
    const navigate = useNavigate()

    const sortAndFilterSettings = useSortAndFilterSettings<TNote>(NOTE_SORT_AND_FILTER_CONFIG)
    const { selectedSort, selectedSortDirection, selectedFilter, isLoading: areSettingsLoading } = sortAndFilterSettings
    const sortedNotes = useMemo(() => {
        if (!notes || areSettingsLoading) return EMPTY_ARRAY
        return sortAndFilterItems({
            items: notes,
            sort: selectedSort,
            sortDirection: selectedSortDirection,
            tieBreakerField: NOTE_SORT_AND_FILTER_CONFIG.tieBreakerField,
        })
    }, [notes, selectedSort, selectedSortDirection, selectedFilter, areSettingsLoading])

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
                    <SortAndFilterSelectors settings={sortAndFilterSettings} />
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
