import { SORT_DIRECTION, SortAndFilterItemsArgs } from './types'

const sortAndFilterItems = <T>({ items, sort, sortDirection, filter, tieBreakerField }: SortAndFilterItemsArgs<T>) => {
    const sortedAndFiltered = filter ? items.filter(filter.lambda) : [...items]
    if (sort && sortDirection) {
        sortedAndFiltered.sort((a, b) => {
            let result = 0
            if (sort.customComparator) {
                result = sort.customComparator(a, b)
            } else if (sort.field && a[sort.field] === b[sort.field]) {
                result = a[tieBreakerField] < b[tieBreakerField] ? -1 : 1
            } else if (sort.field) {
                result = a[sort.field] > b[sort.field] ? 1 : -1
            }

            if ((sort.forceAndHideDirection ?? sortDirection) === SORT_DIRECTION.ASC) {
                return result
            } else {
                return -result
            }
        })
    }
    return sortedAndFiltered
}

export default sortAndFilterItems
