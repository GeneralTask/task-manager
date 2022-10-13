import { TSetting } from '../types'
import { SORT_DIRECTION, SortAndFilterSettingsConfig } from './types'

// groupId is the id of the repo or task section (used when sorting views in the overview page)
const getSortAndFilterSettings = <T>(
    settings: TSetting[],
    config: SortAndFilterSettingsConfig<T>,
    groupId?: string,
    suffix?: '_main' | '_overview' // main if a folder, overview if the overview page
) => {
    const settingPrefix = groupId ? `${groupId}_` : ''
    const settingSuffix = suffix ?? ''
    const sortingPreference = settings.find(
        (setting) => setting.field_key === `${settingPrefix}${config.sortPreferenceId}${settingSuffix}`
    )
    console.log(sortingPreference)
    const sortDirection = settings.find(
        (setting) => setting.field_key === `${settingPrefix}${config.sortDirectionId}${settingSuffix}`
    )
    // allow filter to be empty because we do not currently support task filtering
    const filterPreference = settings.find(
        (setting) => setting.field_key === `${settingPrefix}${config.filterPreferenceId}`
    ) ?? { field_value: '' }

    // all settings come from one endpoint so we can just check if one is loading
    if (!sortingPreference || !sortDirection || !filterPreference) {
        return config.defaultSortsAndFilters
    }

    const selectedSort = config.sortOptions[sortingPreference.field_value]

    const selectedSortDirection = sortDirection.field_value as SORT_DIRECTION

    const selectedFilter = config.filterOptions[filterPreference.field_value]

    return {
        selectedSort,
        selectedSortDirection,
        selectedFilter,
        isLoading: false,
    }
}

export default getSortAndFilterSettings
