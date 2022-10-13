import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetSettings } from '../../services/api/settings.hooks'
import getSortAndFilterSettings from '../../utils/sortAndFilter/getSortAndFilterSettings'
import { PR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'
import { TOverviewItem } from '../../utils/types'

type TOverviewItemWithListId = TOverviewItem & { listId: string }


// returns overview lists with view items sorted and filtered
const useOverviewLists = () => {
    const { data: lists, isLoading: areListsLoading } = useGetOverviewViews()
    const { data: settings, isLoading: areSettingsLoading } = useGetSettings()
    const navigate = useNavigate()


    const sortedAndFilteredLists = useMemo(() => {
        if (areListsLoading || areSettingsLoading || !lists || !settings) return []
        return lists?.map((list) => {
            if (list.type === 'task_section') {
                const { selectedSort, selectedSortDirection, selectedFilter } = getSortAndFilterSettings(
                    settings,
                    TASK_SORT_AND_FILTER_CONFIG,
                    list.task_section_id,
                    '_overview'
                )
                const sortedAndFiltered = sortAndFilterItems({
                    items: list.view_items,
                    sort: selectedSort,
                    sortDirection: selectedSortDirection,
                    filter: selectedFilter,
                    tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
                })
                return { ...list, view_items: sortedAndFiltered, total_view_items: list.view_items.length }
            } else if (list.type === 'github') {
                const { selectedSort, selectedSortDirection, selectedFilter } = getSortAndFilterSettings(
                    settings,
                    PR_SORT_AND_FILTER_CONFIG,
                    list.id
                )
                const sortedAndFiltered = sortAndFilterItems({
                    items: list.view_items,
                    sort: selectedSort,
                    sortDirection: selectedSortDirection,
                    filter: selectedFilter,
                    tieBreakerField: PR_SORT_AND_FILTER_CONFIG.tieBreakerField,
                })
                return { ...list, view_items: sortedAndFiltered, total_view_items: list.view_items.length }
            }
            return list
        })
    }, [lists, areListsLoading, settings, areSettingsLoading])

    // adds listId to the item so we know which list to navigate to
    const flattenedLists: TOverviewItemWithListId[] = useMemo(
        () => sortedAndFilteredLists.flatMap((list) => list.view_items.map((item) => ({ ...item, listId: list.id }))),
        [sortedAndFilteredLists]
    )
    const selectItem = useCallback((item: TOverviewItemWithListId) => {
        navigate(`/overview/${item.listId}/${item.id}`)
        Log(`overview_select__/overview/${item.listId}/${item.id}`)
    }, [])
    useItemSelectionController(flattenedLists, selectItem)
    
    return { lists: sortedAndFilteredLists, isLoading: false }
}

export default useOverviewLists
