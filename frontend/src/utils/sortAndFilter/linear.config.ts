import { icons } from '../../styles/images'
import { FilterOptions, SORT_DIRECTION, SortAndFilterSettingsConfig } from '../../utils/sortAndFilter/types'
import { TTaskV4 } from '../types'
import { emptyFunction } from '../utils'

export const LINEAR_FILTER_OPTIONS: FilterOptions<TTaskV4> = {
    all_cycles: {
        id: 'all_cycles',
        label: 'All cycles',
        icon: icons.linear_cycle_all,
        lambda: () => true,
    },
    current_cycle: {
        id: 'current_cycle',
        label: 'Current cycle',
        icon: icons.linear_cycle_current,
        lambda: (task) => task.linear_cycle?.is_current_cycle == true,
    },
    next_cycle: {
        id: 'next_cycle',
        label: 'Next cycle',
        icon: icons.linear_cycle_next,
        lambda: (task) => task.linear_cycle?.is_next_cycle == true,
    },
    no_cycle: {
        id: 'no_cycle',
        label: 'No cycle',
        icon: icons.linear_cycle_none,
        lambda: (task) => !task.linear_cycle,
    },
}

export const LINEAR_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TTaskV4> = {
    sortOptions: {},
    filterOptions: LINEAR_FILTER_OPTIONS,
    sortPreferenceId: 'linear_task_sorting_preference',
    sortDirectionId: 'linear_task_sorting_direction',
    tieBreakerField: 'id',
    filterPreferenceId: 'linear_task_filtering_preference',
    defaultSortsAndFilters: {
        sortOptions: {},
        filterOptions: LINEAR_FILTER_OPTIONS,
        selectedSort: {
            id: 'placeholder',
            label: 'placeholder',
            field: 'id',
        },
        setSelectedSort: emptyFunction,
        selectedSortDirection: SORT_DIRECTION.DESC,
        setSelectedSortDirection: emptyFunction,
        selectedFilter: LINEAR_FILTER_OPTIONS.no_deleted,
        setSelectedFilter: emptyFunction,
        isLoading: true,
    },
}
