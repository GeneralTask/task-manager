import { useMemo } from 'react'
import { useGTLocalStorage } from '../../hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetSettings } from '../../services/api/settings.hooks'
import getSortAndFilterSettings from '../../utils/sortAndFilter/getSortAndFilterSettings'
import { PR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'

// returns overview lists with view items sorted and filtered
const useOverviewLists = () => {
    const { data: lists, isLoading: areListsLoading, isSuccess } = useGetOverviewViews()
    const { data: settings, isLoading: areSettingsLoading } = useGetSettings()
    const [overviewAutomaticEmptySort] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)

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

    if (overviewAutomaticEmptySort) {
        const copy = [...sortedAndFilteredLists]
        copy.sort((a, b) => {
            if (a.view_items.length === 0 && b.view_items.length > 0) return 1
            if (a.view_items.length > 0 && b.view_items.length === 0) return -1
            return 0
        })
        return { lists: copy, isLoading: areListsLoading, isSuccess }
    }
    return { lists: sortedAndFilteredLists, isLoading: areListsLoading, isSuccess: isSuccess }
}

export default useOverviewLists
