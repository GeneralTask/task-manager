import { GHSortDirection, GHSortPreference } from '../../services/api/settings.hooks'

export enum SORT_ORDER {
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
    field?: keyof T
    customComparator?: (a: T, b: T) => number
}

// should return true if item should be included in the filtered list
export type Filter<T> = (item: T) => boolean

export interface SortAndFilterItemsArgs<T> {
    items: T[]
    sort?: Sort<T>
    sortDirection?: SORT_ORDER
    filter?: Filter<T>
}

export interface SortOptions<T> {
    [key: string]: Sort<T>
}

export interface SortAndFilterSettingsConfig<T> {
    sortOptions: SortOptions<T>
    sortPreferenceId: GHSortPreference
    sortDirectionId: GHSortDirection
    defaultSortsAndFilters: SortAndFilterSettings<T>
}

export interface SortAndFilterSettings<T> {
    sortItems: SortOptions<T>
    selectedSort: Sort<T>
    setSelectedSort: (selectedSort: Sort<T>) => void
    selectedSortDirection: SORT_ORDER
    setSelectedSortDirection: (selectedSortDirection: SORT_ORDER) => void
}
