import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { DONE_FOLDER_ID, TRASH_FOLDER_ID } from '../constants'
import { useGetFolders } from '../services/api/folders.hooks'
import { useGetMeetingPreparationTasks } from '../services/api/meeting-preparation-tasks.hooks'
import { useGetTasksV4 } from '../services/api/tasks.hooks'
import sortAndFilterItems from '../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../utils/sortAndFilter/useSortAndFilterSettings'
import { TTaskV4 } from '../utils/types'

const useGetSortedFolderTasks = (folderId: string) => {
    const { data: meetingPreparationTasks } = useGetMeetingPreparationTasks()
    const { data: allTasks } = useGetTasksV4()
    const { data: folders } = useGetFolders()

    const folder = useMemo(() => folders?.find(({ id }) => id === folderId), [folders, folderId])

    const folderTasks = useMemo(() => {
        if (!folder) return []
        if (folder.id === DONE_FOLDER_ID) {
            return [
                ...(meetingPreparationTasks?.filter((t) => t.is_done && !t.is_deleted) || []),
                ...(allTasks?.filter((t) => t.is_done && !t.is_deleted && !t.id_parent) || []),
            ].sort((a, b) => +DateTime.fromISO(b.updated_at) - +DateTime.fromISO(a.updated_at))
        } else if (folder.id === TRASH_FOLDER_ID) {
            return [
                ...(meetingPreparationTasks?.filter((t) => t.is_deleted) || []),
                ...(allTasks?.filter((t) => t.is_deleted) || []),
            ].sort((a, b) => +DateTime.fromISO(b.updated_at) - +DateTime.fromISO(a.updated_at))
        }
        return allTasks?.filter((t) => t.id_folder === folder.id && !t.is_done && !t.is_deleted) || []
    }, [allTasks, folder, meetingPreparationTasks])
    const sortAndFilterSettings = useSortAndFilterSettings<TTaskV4>(TASK_SORT_AND_FILTER_CONFIG, folder?.id, '_main')
    const { selectedSort, selectedSortDirection, isLoading: areSettingsLoading } = sortAndFilterSettings

    return useMemo(() => {
        if (folder && (folder.is_done || folder.is_trash)) return folderTasks
        if (!folder || areSettingsLoading) return []

        return sortAndFilterItems<TTaskV4>({
            items: folderTasks,
            sort: selectedSort,
            sortDirection: selectedSortDirection,
            tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
        })
    }, [folder, folderTasks, selectedSort, selectedSortDirection, areSettingsLoading])
}

export default useGetSortedFolderTasks
