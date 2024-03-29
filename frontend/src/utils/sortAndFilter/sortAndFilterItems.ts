import { SORT_DIRECTION, SortAndFilterItemsArgs } from './types'

const sortAndFilterItems = <T>({ items, sort, sortDirection, filter, tieBreakerField }: SortAndFilterItemsArgs<T>) => {
    const sortedAndFiltered = filter ? items.filter(filter.lambda) : [...items]
    if (sort && sortDirection) {
        sortedAndFiltered.sort((a, b) => {
            const sortDirectionMultiplier = (sort.forceDirection ?? sortDirection) === SORT_DIRECTION.ASC ? 1 : -1
            let result = 0
            if (a[sort.field] === b[sort.field]) {
                if (
                    !sort.secondaryField ||
                    (sort.secondaryField && a[sort.secondaryField] === b[sort.secondaryField])
                ) {
                    result = a[tieBreakerField] < b[tieBreakerField] ? -1 : 1
                    result *= sortDirectionMultiplier
                } else {
                    if (a[sort.secondaryField] && b[sort.secondaryField]) {
                        result = a[sort.secondaryField] > b[sort.secondaryField] ? 1 : -1
                        result *= sortDirectionMultiplier
                    } else if (!a[sort.secondaryField]) {
                        result = sortDirectionMultiplier
                    } else if (!b[sort.secondaryField]) {
                        result = -sortDirectionMultiplier
                    }
                }
            } else {
                if (a[sort.field] && b[sort.field]) {
                    if (sort.customComparator) {
                        result = sort.customComparator(a, b)
                    } else {
                        result = a[sort.field] > b[sort.field] ? 1 : -1
                    }
                }
                // ensure that empty fields are always sorted to the bottom regardless of order
                else if (!a[sort.field]) {
                    result = sortDirectionMultiplier
                } else if (!b[sort.field]) {
                    result = -sortDirectionMultiplier
                }
            }
            return result * sortDirectionMultiplier
        })
    }
    return sortedAndFiltered
}

export default sortAndFilterItems
