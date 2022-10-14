import { isEmpty } from '../utils'
import { SORT_DIRECTION, SortAndFilterItemsArgs } from './types'

const sortAndFilterItems = <T>({ items, sort, sortDirection, filter, tieBreakerField }: SortAndFilterItemsArgs<T>) => {
    const sortedAndFiltered = filter ? items.filter(filter.lambda) : [...items]
    if (sort && sortDirection) {
        sortedAndFiltered.sort((a, b) => {
            const sortDirectionMultiplier =
                (sort.forceAndHideDirection ?? sortDirection) === SORT_DIRECTION.ASC ? 1 : -1
            let result = 0
            if (sort.customComparator) {
                result = sort.customComparator(a, b)
            } else if (sort.field && a[sort.field] === b[sort.field]) {
                result = a[tieBreakerField] < b[tieBreakerField] ? -1 : 1
            } else if (sort.field) {
                if (!isEmpty(a[sort.field]) && !isEmpty(b[sort.field])) {
                    result = a[sort.field] > b[sort.field] ? 1 : -1
                }
                // ensure that empty fields are always sorted to the bottom regardless of order
                else if (isEmpty(a[sort.field])) {
                    result = sortDirectionMultiplier
                } else if (isEmpty(b[sort.field])) {
                    result = -sortDirectionMultiplier
                }
            }
            return result * sortDirectionMultiplier
        })
    }
    return sortedAndFiltered
}

export default sortAndFilterItems
