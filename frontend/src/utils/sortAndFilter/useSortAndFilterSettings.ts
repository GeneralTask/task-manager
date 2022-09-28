import { useSetting } from '../../hooks'
import { Sort, SortAndFilterSettings, SortAndFilterSettingsConfig, SORT_ORDER } from './types'

// groupId is the id of the repo or task section (used when sorting views in the overview page)
const useSortAndFilterSettings = <T>(config: SortAndFilterSettingsConfig<T>, groupId?: string): SortAndFilterSettings<T> => {
    const settingPrefix = groupId ? `${groupId}_` : ''
    const sortingPreference = useSetting(`${settingPrefix}${config.sortPreferenceId}`)
    const sortDirection = useSetting(`${settingPrefix}${config.sortDirectionId}`)

    // all settings come from one endpoint so we can just check if one is loading
    if (sortingPreference.isLoading) {
        return config.defaultSortsAndFilters
    }

    const selectedSort = config.sortOptions[sortingPreference.field_value]
    const setSelectedSort = (selectedSort: Sort<T>) => {
        sortingPreference.updateSetting(selectedSort.id)
    }
    const selectedSortDirection = sortDirection.field_value as SORT_ORDER
    const setSelectedSortDirection = (selectedSortDirection: SORT_ORDER) => {
        sortDirection.updateSetting(selectedSortDirection)
    }

    return {
        sortItems: config.sortOptions,
        selectedSort,
        setSelectedSort,
        selectedSortDirection,
        setSelectedSortDirection,
    }
}

export default useSortAndFilterSettings
