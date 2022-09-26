import { Sort } from '../../hooks/useSortAndFilter'
import { icons } from '../../styles/images'
import { SORT_ORDER } from '../../utils/enums'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

export interface SortSelectorItems<T> {
    [key: string]: {
        label: string
        sort: Omit<Sort<T>, 'direction'>
    }
}

interface SortSelectorProps<T> {
    items: SortSelectorItems<T> // constant determining the sort options
    selectedSort: Sort<T>
    setSelectedSort: (sort: Sort<T>) => void
}
const SortSelector = <T,>({ items, selectedSort, setSelectedSort }: SortSelectorProps<T>) => {
    const sortItems: GTMenuItem[] = Object.entries(items).map(([, value]) => ({
        ...value,
        selected: selectedSort.id === value.sort.id,
        onClick: () =>
            setSelectedSort({
                ...value.sort,
                direction: selectedSort.direction,
            }),
    }))
    const sortOrderGroups: GTMenuItem[] = [
        {
            label: 'Ascending',
            icon: icons.arrow_up,
            selected: selectedSort.direction === SORT_ORDER.ASC,
            onClick: () =>
                setSelectedSort({
                    ...selectedSort,
                    direction: SORT_ORDER.ASC,
                }),
        },
        {
            label: 'Descending',
            icon: icons.arrow_down,
            selected: selectedSort.direction === SORT_ORDER.DESC,
            onClick: () =>
                setSelectedSort({
                    ...selectedSort,
                    direction: SORT_ORDER.DESC,
                }),
        },
    ]

    return (
        <GTDropdownMenu
            items={[sortItems, sortOrderGroups]}
            trigger={
                <GTButton
                    icon={selectedSort.direction === SORT_ORDER.ASC ? icons.arrow_up : icons.arrow_down}
                    value={items[selectedSort.id].label}
                    styleType="secondary"
                    size="small"
                    asDiv
                />
            }
        />
    )
}

export default SortSelector
