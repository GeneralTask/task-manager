import { icons } from '../../styles/images'
import { SORT_ORDER, Sort, SortOptions } from '../../utils/sortAndFilter/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

interface SortSelectorProps<T> {
    items: SortOptions<T> // constant determining the sort options
    selectedSort: Sort<T>
    setSelectedSort: (sort: Sort<T>) => void
    selectedSortDirection: SORT_ORDER
    setSelectedSortDirection: (selectedSortDirection: SORT_ORDER) => void
}
const SortSelector = <T,>({
    items,
    selectedSort,
    setSelectedSort,
    selectedSortDirection,
    setSelectedSortDirection,
}: SortSelectorProps<T>) => {
    const sortItems: GTMenuItem[] = Object.entries(items).map(([, value]) => ({
        ...value,
        selected: selectedSort.id === value.id,
        icon: icons.priority_urgent,
        onClick: () => setSelectedSort(value),
    }))
    const sortOrderGroups: GTMenuItem[] = [
        {
            label: 'Ascending',
            icon: icons.arrow_up,
            selected: selectedSortDirection === SORT_ORDER.ASC,
            onClick: () => setSelectedSortDirection(SORT_ORDER.ASC),
        },
        {
            label: 'Descending',
            icon: icons.arrow_down,
            selected: selectedSortDirection === SORT_ORDER.DESC,
            onClick: () => setSelectedSortDirection(SORT_ORDER.DESC),
        },
    ]

    return (
        <GTDropdownMenu
            items={[sortItems, sortOrderGroups]}
            trigger={
                <GTButton
                    icon={selectedSortDirection === SORT_ORDER.ASC ? icons.arrow_up : icons.arrow_down}
                    value={items[selectedSort.id].label}
                    styleType="secondary"
                    size="small"
                />
            }
        />
    )
}

export default SortSelector
