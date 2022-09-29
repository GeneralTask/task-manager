import { useSetting } from '../../hooks'
import { Filter, SORT_DIRECTION, Sort, SortAndFilterSettings, SortAndFilterSettingsConfig } from './types'

// groupId is the id of the repo or task section (used when sorting views in the overview page)
const useSortAndFilterSettings = <T>(
    config: SortAndFilterSettingsConfig<T>,
    groupId?: string
): SortAndFilterSettings<T> => {
    const settingPrefix = groupId ? `${groupId}_` : ''
    const sortingPreference = useSetting(`${settingPrefix}${config.sortPreferenceId}`)
    const sortDirection = useSetting(`${settingPrefix}${config.sortDirectionId}`)
    const filterPreference = useSetting(`${settingPrefix}${config.filterPreferenceId}`)

    // all settings come from one endpoint so we can just check if one is loading
    if (sortingPreference.isLoading) {
        return config.defaultSortsAndFilters
    }

    const selectedSort = config.sortOptions[sortingPreference.field_value]
    const setSelectedSort = (selectedSort: Sort<T>) => {
        sortingPreference.updateSetting(selectedSort.id)
    }
    const selectedSortDirection = sortDirection.field_value as SORT_DIRECTION
    const setSelectedSortDirection = (selectedSortDirection: SORT_DIRECTION) => {
        sortDirection.updateSetting(selectedSortDirection)
    }
    const selectedFilter = config.filterOptions[filterPreference.field_value]
    const setSelectedFilter = (selectedFilter: Filter<T>) => {
        filterPreference.updateSetting(selectedFilter.id)
    }

    return {
        sortOptions: config.sortOptions,
        filterOptions: config.filterOptions,
        selectedSort,
        setSelectedSort,
        selectedSortDirection,
        setSelectedSortDirection,
        selectedFilter,
        setSelectedFilter,
    }
}

export default useSortAndFilterSettings
