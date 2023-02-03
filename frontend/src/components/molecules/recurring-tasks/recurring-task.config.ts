import { FilterOptions, SORT_DIRECTION, SortAndFilterSettingsConfig } from '../../../utils/sortAndFilter/types'
import { TRecurringTaskTemplate } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'

export const RECURRING_TASK_FILTER_OPTIONS: FilterOptions<TRecurringTaskTemplate> = {
    no_deleted: {
        id: 'no_deleted',
        label: 'Default',
        lambda: (task: TRecurringTaskTemplate) => !task.is_deleted,
    },
    show_deleted: {
        id: 'show_deleted',
        label: 'Show deleted',
        lambda: () => true,
    },
}

export const RECURRING_TASK_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TRecurringTaskTemplate> = {
    sortOptions: {},
    filterOptions: RECURRING_TASK_FILTER_OPTIONS,
    sortPreferenceId: 'recurring_task_sorting_preference',
    sortDirectionId: 'recurring_task_sorting_direction',
    filterPreferenceId: 'recurring_task_filtering_preference',
    tieBreakerField: 'id',
    defaultSortsAndFilters: {
        sortOptions: {},
        filterOptions: RECURRING_TASK_FILTER_OPTIONS,
        selectedSort: {
            id: 'placeholder',
            label: 'placeholder',
            field: 'id',
        },
        setSelectedSort: emptyFunction,
        selectedSortDirection: SORT_DIRECTION.DESC,
        setSelectedSortDirection: emptyFunction,
        selectedFilter: RECURRING_TASK_FILTER_OPTIONS.no_deleted,
        setSelectedFilter: emptyFunction,
        isLoading: true,
    },
}
