import { SORT_ORDER, SortAndFilterItemsArgs } from './types'

const sortAndFilterItems = <T>({ items, sort, sortDirection, filter }: SortAndFilterItemsArgs<T>) => {
    let sortedAndFiltered = items
    if (filter) {
        sortedAndFiltered = sortedAndFiltered.filter(filter)
    }
    if (sort && sortDirection) {
        sortedAndFiltered = sortedAndFiltered.sort((a, b) => {
            let result = 0
            if (sort.customComparator) {
                result = sort.customComparator(a, b)
            } else if (sort.field) {
                result = a[sort.field] > b[sort.field] ? 1 : -1
            }
            if (sortDirection === SORT_ORDER.ASC) {
                return result
            } else {
                return -result
            }
        })
    }
    return sortedAndFiltered
}

export default sortAndFilterItems
