import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGTLocalStorage, useItemSelectionController } from '../../hooks'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
import Log from '../../services/api/log'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetSettings } from '../../services/api/settings.hooks'
import getSortAndFilterSettings from '../../utils/sortAndFilter/getSortAndFilterSettings'
import { LINEAR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/linear.config'
import { PR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'
import { TOverviewItem } from '../../utils/types'

type TOverviewItemWithListId = TOverviewItem & { listId: string }

// returns overview lists with view items sorted and filtered
const useOverviewLists = () => {
    const { data: lists, isLoading: isListsLoading, isSuccess } = useGetOverviewViews()
    const { data: settings, isLoading: isSettingsLoading } = useGetSettings()
    const { data: activeTasks, isLoading: isActiveTasksLoading } = useGetActiveTasks()
    const { data: repositories, isLoading: isRepositoriesLoading } = useGetPullRequests()
    const navigate = useNavigate()

    const [overviewAutomaticEmptySort] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)

    const pullRequests = useMemo(() => repositories?.flatMap((repo) => repo.pull_requests), [repositories])
    const isLoading = isListsLoading || isSettingsLoading || isActiveTasksLoading || isRepositoriesLoading

    const sortedAndFilteredLists = useMemo(() => {
        if (isListsLoading || isSettingsLoading || isActiveTasksLoading || isRepositoriesLoading || !lists || !settings)
            return []
        const sortedAndFiltered = lists?.map((list) => {
            if (list.type === 'task_section') {
                const { selectedSort, selectedSortDirection, selectedFilter } = getSortAndFilterSettings(
                    settings,
                    TASK_SORT_AND_FILTER_CONFIG,
                    list.task_section_id,
                    '_overview'
                )
                const viewItems = (activeTasks?.filter((task) => list.view_item_ids.includes(task.id)) ??
                    []) as TOverviewItem[]
                const sortedAndFiltered = sortAndFilterItems({
                    items: viewItems,
                    sort: selectedSort,
                    sortDirection: selectedSortDirection,
                    filter: selectedFilter,
                    tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
                })
                return { ...list, view_items: sortedAndFiltered, total_view_items: list.view_items.length }
            } else if (list.type === 'linear') {
                const { selectedFilter } = getSortAndFilterSettings(
                    settings,
                    LINEAR_SORT_AND_FILTER_CONFIG,
                    undefined,
                    '_overview'
                )
                const linearTasks =
                    (activeTasks?.filter((task) => list.view_item_ids.includes(task.id)) as TOverviewItem[]) || []
                const sortedAndFiltered = sortAndFilterItems<TOverviewItem>({
                    items: linearTasks,
                    filter: selectedFilter,
                    tieBreakerField: LINEAR_SORT_AND_FILTER_CONFIG.tieBreakerField,
                })
                return { ...list, view_items: sortedAndFiltered, total_view_items: list.view_items.length }
            } else if (list.type === 'github') {
                const { selectedSort, selectedSortDirection, selectedFilter } = getSortAndFilterSettings(
                    settings,
                    PR_SORT_AND_FILTER_CONFIG,
                    list.id
                )
                const viewItems = (pullRequests?.filter((pr) => list.view_item_ids.includes(pr.id)) ??
                    []) as TOverviewItem[]
                const sortedAndFiltered = sortAndFilterItems({
                    items: viewItems,
                    sort: selectedSort,
                    sortDirection: selectedSortDirection,
                    filter: selectedFilter,
                    tieBreakerField: PR_SORT_AND_FILTER_CONFIG.tieBreakerField,
                })
                return { ...list, view_items: sortedAndFiltered, total_view_items: list.view_items.length }
            }
            return list
        })
        if (overviewAutomaticEmptySort) {
            sortedAndFiltered.sort((a, b) => {
                if (a.view_items.length === 0 && b.view_items.length > 0) return 1
                if (a.view_items.length > 0 && b.view_items.length === 0) return -1
                return 0
            })
        }
        return sortedAndFiltered
    }, [lists, isLoading, settings, overviewAutomaticEmptySort, activeTasks, pullRequests])

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

    return { lists: sortedAndFilteredLists, isLoading: isLoading, isSuccess: isSuccess, flattenedLists }
}

export default useOverviewLists
