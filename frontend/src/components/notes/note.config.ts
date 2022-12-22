import {
    FilterOptions,
    SORT_DIRECTION,
    SortAndFilterSettingsConfig,
    SortOptions,
} from '../../utils/sortAndFilter/types'
import { TNote } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'

export const NOTE_SORT_SELECTOR_ITEMS: SortOptions<TNote> = {
    updated_at: {
        id: 'updated_at',
        label: 'Updated at',
        field: 'updated_at',
        defaultDirection: SORT_DIRECTION.DESC,
    },
    created_at: {
        id: 'created_at',
        label: 'Created at',
        field: 'created_at',
        defaultDirection: SORT_DIRECTION.DESC,
    },
}

export const NOTE_FILTER_OPTIONS: FilterOptions<TNote> = {
    no_deleted: {
        id: 'no_deleted',
        label: 'Default',
        lambda: (note: TNote) => !note.is_deleted,
    },
    show_deleted: {
        id: 'show_deleted',
        label: 'Show deleted',
        lambda: () => true,
    },
}

export const NOTE_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TNote> = {
    sortOptions: NOTE_SORT_SELECTOR_ITEMS,
    filterOptions: NOTE_FILTER_OPTIONS,
    sortPreferenceId: 'note_sorting_preference',
    sortDirectionId: 'note_sorting_direction',
    filterPreferenceId: 'github_filtering_preference',
    tieBreakerField: 'updated_at',
    defaultSortsAndFilters: {
        sortOptions: NOTE_SORT_SELECTOR_ITEMS,
        filterOptions: NOTE_FILTER_OPTIONS,
        selectedSort: NOTE_SORT_SELECTOR_ITEMS.updated_at,
        setSelectedSort: emptyFunction,
        selectedSortDirection: SORT_DIRECTION.DESC,
        setSelectedSortDirection: emptyFunction,
        selectedFilter: NOTE_FILTER_OPTIONS.no_deleted,
        setSelectedFilter: emptyFunction,
        isLoading: true,
    },
}
