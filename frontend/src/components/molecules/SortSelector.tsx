import { Sort } from '../../hooks/useSortAndFilter'
import { icons } from '../../styles/images'
import { SORT_ORDER } from '../../utils/enums'
import GTDropdownMenu, { GTDropdownMenuItem } from '../atoms/GTDropdownMenu'
import GTButton from '../atoms/buttons/GTButton'

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
    const sortItems: GTDropdownMenuItem[] = Object.entries(items).map(([, value]) => ({
        ...value,
        selected: selectedSort.id === value.sort.id,
        onClick: () =>
            setSelectedSort({
                ...value.sort,
                direction: selectedSort.direction,
            }),
    }))
    const sortOrderGroups: GTDropdownMenuItem[] = [
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
                />
            }
        />
    )
}

export default SortSelector
