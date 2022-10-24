import {
    GHFilterPreference,
    GHSortDirection,
    GHSortPreference,
    TaskFilterPreference,
    TaskSortDirection,
    TaskSortPreference,
} from '../../services/api/settings.hooks'
import { TIconImage } from '../../styles/images'

export enum SORT_DIRECTION {
    ASC = 'ascending',
    DESC = 'descending',
}

/* 
    Defines a method to sort an array of items
    * "id" is a unique identifier for the item
    * "field" is the name of an attribute of the item object to sort by (e.g. "name")
    * "customComparator" can be provided to sort by a specified method if the field is not sufficient. 
    * "direction" is the direction to sort in (ASC or DESC) and applies to *both* field and customComparator sorting (so you do not need to change the comparator to reverse the sort order)
    * only one sort method should be supplied; if both are supplied then customCamparator will take precedence 
*/
export interface Sort<T> {
    id: string
    label: string
    field: keyof T
    customComparator?: (a: T, b: T) => number
    icon?: TIconImage
    // if this is set, the direction will be forced to this value and the direction selector will be hidden
    forceDirection?: SORT_DIRECTION
}

export interface Filter<T> {
    id: string
    label: string
    // should return true if item should be included in the filtered list
    lambda: (item: T) => boolean
}

export interface SortAndFilterItemsArgs<T> {
    items: T[]
    sort?: Sort<T>
    sortDirection?: SORT_DIRECTION
    filter?: Filter<T>
    tieBreakerField: keyof T
}

export interface SortOptions<T> {
    [key: string]: Sort<T>
}

export interface FilterOptions<T> {
    [key: string]: Filter<T>
}

export interface SortAndFilterSettingsConfig<T> {
    sortOptions: SortOptions<T>
    filterOptions: FilterOptions<T>
    sortPreferenceId: GHSortPreference | TaskSortPreference
    sortDirectionId: GHSortDirection | TaskSortDirection
    filterPreferenceId: GHFilterPreference | TaskFilterPreference
    tieBreakerField: keyof T
    defaultSortsAndFilters: SortAndFilterSettings<T>
}

export interface SortAndFilterSettings<T> {
    sortOptions: SortOptions<T>
    filterOptions: FilterOptions<T>
    selectedSort: Sort<T>
    setSelectedSort: (selectedSort: Sort<T>) => void
    selectedSortDirection: SORT_DIRECTION
    setSelectedSortDirection: (selectedSortDirection: SORT_DIRECTION) => void
    selectedFilter: Filter<T>
    setSelectedFilter: (selectedFilter: Filter<T>) => void
    isLoading: boolean
}
