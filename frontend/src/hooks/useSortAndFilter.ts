import { useMemo } from 'react'
import { SORT_ORDER } from '../utils/enums'

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
    direction: SORT_ORDER
    field?: keyof T
    customComparator?: (a: T, b: T) => number
}

// should return true if item should be included in the filtered list
export type Filter<T> = (item: T) => boolean
export interface SortAndFilterArgs<T> {
    items: T[]
    sort?: Sort<T>
    filter?: Filter<T>
}
const useSortAndFilter = <T>({ items, sort, filter }: SortAndFilterArgs<T>) => {
    return useMemo(() => {
        let sortedAndFiltered = items
        if (filter) {
            sortedAndFiltered = sortedAndFiltered.filter(filter)
        }
        if (sort) {
            sortedAndFiltered = sortedAndFiltered.sort((a, b) => {
                let result = 0
                if (sort.customComparator) {
                    result = sort.customComparator(a, b)
                } else if (sort.field) {
                    result = a[sort.field] > b[sort.field] ? 1 : -1
                }
                if (sort.direction === SORT_ORDER.ASC) {
                    return result
                } else {
                    return -result
                }
            })
        }
        return sortedAndFiltered
    }, [items, filter, sort])
}

export default useSortAndFilter
