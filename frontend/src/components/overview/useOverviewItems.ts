import { useMemo } from 'react'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
import { useGetMeetingPreparationTasks } from '../../services/api/meeting-preparation-tasks.hooks'
import { useGetPullRequests } from '../../services/api/pull-request.hooks'
import { useGetSettings } from '../../services/api/settings.hooks'
import { PR_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/pull-requests.config'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import { TASK_SORT_AND_FILTER_CONFIG } from '../../utils/sortAndFilter/tasks.config'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { TOverviewView } from '../../utils/types'

// returns overview lists with view items sorted and filtered
const useOverviewItems = (list: TOverviewView) => {
    // const { data: lists, isLoading: isListsLoading, isSuccess } = useGetOverviewViews()
    const { data: settings, isLoading: isSettingsLoading } = useGetSettings()
    const { data: activeTasks, isLoading: isActiveTasksLoading } = useGetActiveTasks()
    const { data: meetingPrepTasks, isLoading: isMeetingPrepTasksLoading } = useGetMeetingPreparationTasks()
    const { data: repositories, isLoading: isRepositoriesLoading } = useGetPullRequests()
    const pullRequests = useMemo(() => repositories?.flatMap((repo) => repo.pull_requests), [repositories])

    // const [overviewAutomaticEmptySort] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)

    const isLoading = isSettingsLoading || isActiveTasksLoading || isRepositoriesLoading || isMeetingPrepTasksLoading

    const taskSortAndFilterSettings = useSortAndFilterSettings(TASK_SORT_AND_FILTER_CONFIG, list.id, '_overview')
    const prSortAndFilterSettings = useSortAndFilterSettings(PR_SORT_AND_FILTER_CONFIG, list.id)

    const sortAndFilterSettings =
        list.type === 'task_section'
            ? taskSortAndFilterSettings
            : list.type === 'github'
            ? prSortAndFilterSettings
            : undefined

    const sortedAndFilteredItems = useMemo(() => {
        if (isLoading || !settings) return []

        if (list.type === 'task_section') {
            const viewItems = activeTasks?.filter((task) => list.view_item_ids.includes(task.id)) ?? []
            return (
                sortAndFilterItems({
                    items: viewItems,
                    sort: taskSortAndFilterSettings.selectedSort,
                    sortDirection: taskSortAndFilterSettings.selectedSortDirection,
                    filter: taskSortAndFilterSettings.selectedFilter,
                    tieBreakerField: TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
                }) ?? []
            )
        } else if (list.type === 'github') {
            const viewItems = pullRequests?.filter((pr) => list.view_item_ids.includes(pr.id)) ?? []
            return (
                sortAndFilterItems({
                    items: viewItems,
                    sort: prSortAndFilterSettings.selectedSort,
                    sortDirection: prSortAndFilterSettings.selectedSortDirection,
                    filter: prSortAndFilterSettings.selectedFilter,
                    tieBreakerField: PR_SORT_AND_FILTER_CONFIG.tieBreakerField,
                }) ?? []
            )
        } else if (list.type === 'meeting_preparation') {
            return meetingPrepTasks
        } else {
            return activeTasks?.filter((task) => list.view_item_ids.includes(task.id)) ?? []
        }
    }, [
        list,
        isLoading,
        settings,
        activeTasks,
        pullRequests,
        meetingPrepTasks,
        taskSortAndFilterSettings,
        prSortAndFilterSettings,
        meetingPrepTasks,
    ])

    // adds listId to the item so we know which list to navigate to
    // const flattenedLists: TOverviewItemWithListId[] = useMemo(
    //     () => sortedAndFilteredLists.flatMap((list) => list.view_items.map((item) => ({ ...item, listId: list.id }))),
    //     [sortedAndFilteredLists]
    // )
    // const selectItem = useCallback((item: TOverviewItemWithListId) => {
    //     navigate(`/overview/${item.listId}/${item.id}`)
    //     Log(`overview_select__/overview/${item.listId}/${item.id}`)
    // }, [])
    // useItemSelectionController(flattenedLists, selectItem)

    return { sortedAndFilteredItems, isLoading, sortAndFilterSettings }
}

export default useOverviewItems
