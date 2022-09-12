import { useMemo } from "react"
import { SORT_ORDER } from "../utils/enums"

interface SortAndFilterArgs<T> {
    items: T[]
    sort?: {
        field: keyof T // the attribute in T to sort by (i.e. 'id')
        direction: SORT_ORDER
        comparator?: (a: T, b: T) => number // custom comparator
    }
    filter?: (item: T) => boolean // should return true if item should be included in the filtered list
}
const useSortAndFilter = <T>({ items, sort, filter }: SortAndFilterArgs<T>) => {
    return useMemo(() => {
        let sortedAndFiltered = items
        if (filter) {
            sortedAndFiltered = sortedAndFiltered.filter(filter)
        }
        if (sort) {
            sortedAndFiltered = sortedAndFiltered.sort((a, b) => {
                if (sort.comparator) {
                    return sort.comparator(a, b)
                }
                if (sort.direction === SORT_ORDER.ASC) {
                    return a[sort.field] > b[sort.field] ? 1 : -1
                } else {
                    return a[sort.field] < b[sort.field] ? 1 : -1
                }
            })
        }
        return sortedAndFiltered
    }, [items, filter, sort])

}

export default useSortAndFilter
