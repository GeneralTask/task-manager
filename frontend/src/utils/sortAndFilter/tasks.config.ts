import { TTask } from '../types'
import { emptyFunction } from '../utils'
import { SORT_DIRECTION, SortAndFilterSettingsConfig, SortOptions } from './types'

export const TASK_SORT_SELECTOR_ITEMS: SortOptions<TTask> = {
    manual: {
        id: 'manual',
        label: 'Manual',
        field: 'id_ordering',
        icon: 'sort',
        forceDirection: SORT_DIRECTION.ASC,
    },
    due_date: {
        id: 'due_date',
        label: 'Due date',
        field: 'due_date',
    },
    priority: {
        id: 'priority',
        label: 'Priority',
        field: 'priority_normalized',
        customComparator: (a, b) => b.priority_normalized - a.priority_normalized,
    },
}

export const TASK_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TTask> = {
    sortOptions: TASK_SORT_SELECTOR_ITEMS,
    filterOptions: {},
    sortPreferenceId: 'task_sorting_preference',
    sortDirectionId: 'task_sorting_direction',
    filterPreferenceId: 'task_filtering_preference',
    tieBreakerField: 'id_ordering',
    defaultSortsAndFilters: {
        sortOptions: TASK_SORT_SELECTOR_ITEMS,
        filterOptions: {},
        selectedSort: TASK_SORT_SELECTOR_ITEMS.manual,
        setSelectedSort: emptyFunction,
        selectedSortDirection: SORT_DIRECTION.DESC,
        setSelectedSortDirection: emptyFunction,
        // will update once we add task filtering
        selectedFilter: {
            id: 'placeholder',
            label: 'placeholder',
            lambda: () => true,
        },
        setSelectedFilter: emptyFunction,
        isLoading: true,
    },
}
