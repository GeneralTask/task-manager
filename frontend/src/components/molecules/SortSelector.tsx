import { icons } from '../../styles/images'
import { SORT_DIRECTION, Sort, SortOptions } from '../../utils/sortAndFilter/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

interface SortSelectorProps<T> {
    sortOptions: SortOptions<T> // constant determining the sort options
    selectedSort: Sort<T>
    setSelectedSort: (sort: Sort<T>) => void
    selectedSortDirection: SORT_DIRECTION
    setSelectedSortDirection: (selectedSortDirection: SORT_DIRECTION) => void
}
const SortSelector = <T,>({
    sortOptions,
    selectedSort,
    setSelectedSort,
    selectedSortDirection,
    setSelectedSortDirection,
}: SortSelectorProps<T>) => {
    const sortItems: GTMenuItem[] = Object.entries(sortOptions).map(([, value]) => ({
        ...value,
        selected: selectedSort.id === value.id,
        icon: icons.sort,
        onClick: () => setSelectedSort(value),
    }))
    const sortOrderGroups: GTMenuItem[] = [
        {
            label: 'Ascending',
            icon: icons.arrow_up,
            selected: selectedSortDirection === SORT_DIRECTION.ASC,
            onClick: () => setSelectedSortDirection(SORT_DIRECTION.ASC),
        },
        {
            label: 'Descending',
            icon: icons.arrow_down,
            selected: selectedSortDirection === SORT_DIRECTION.DESC,
            onClick: () => setSelectedSortDirection(SORT_DIRECTION.DESC),
        },
    ]

    return (
        <GTDropdownMenu
            items={[sortItems, sortOrderGroups]}
            trigger={
                <GTButton
                    icon={selectedSortDirection === SORT_DIRECTION.ASC ? icons.arrow_up : icons.arrow_down}
                    value={sortOptions[selectedSort.id].label}
                    styleType="secondary"
                    size="small"
                    asDiv
                />
            }
        />
    )
}

export default SortSelector
