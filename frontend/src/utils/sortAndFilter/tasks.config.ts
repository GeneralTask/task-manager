import { TTask } from '../types'
import { emptyFunction } from '../utils'
import { SORT_DIRECTION, SortAndFilterSettingsConfig, SortOptions } from './types'

const NO_PRIORITY = 1000000

export const TASK_SORT_SELECTOR_ITEMS: SortOptions<TTask> = {
    manual: {
        id: 'manual',
        label: 'Manual',
        customComparator: (a: TTask, b: TTask) => {
            return b.id_ordering - a.id_ordering
        },
        forceAndHideDirection: SORT_DIRECTION.DESC,
    },
    due_date: {
        id: 'due_date',
        label: 'Due date',
        field: 'due_date',
    },
    priority: {
        id: 'priority',
        label: 'Priority',
        customComparator: (a: TTask, b: TTask) => {
            return (b.priority_normalized || NO_PRIORITY) - (a.priority_normalized || NO_PRIORITY)
        },
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
