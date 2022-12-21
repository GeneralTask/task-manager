import { useMemo } from 'react'
import styled from 'styled-components'
import GTButton from '../../components/atoms/buttons/GTButton'
import GTDropdownMenu from '../../components/radix/GTDropdownMenu'
import { GTMenuItem } from '../../components/radix/RadixUIConstants'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { SORT_DIRECTION, SortAndFilterSettings } from './types'

const SortAndFilterContainer = styled.div`
    display: flex;
    gap: ${Spacing._8};
    margin-bottom: ${Spacing._16};
    z-index: 1;
`

interface SortAndFilterDropdownsProps<T> {
    settings: SortAndFilterSettings<T>
}

const SortAndFilterDropdowns = <T,>({
    settings: {
        sortOptions,
        filterOptions,
        selectedSort,
        setSelectedSort,
        selectedSortDirection,
        setSelectedSortDirection,
        selectedFilter,
        setSelectedFilter,
    },
}: SortAndFilterDropdownsProps<T>) => {
    const sortItems: GTMenuItem[] = useMemo(
        () =>
            Object.entries(sortOptions).map(([, value]) => ({
                ...value,
                selected: selectedSort.id === value.id,
                icon: icons.sort,
                onClick: () => {
                    if (selectedSort.id === value.id) return
                    setSelectedSort(value)
                    if (value.defaultDirection) {
                        setSelectedSortDirection(value.defaultDirection)
                    }
                },
            })),
        [sortOptions, selectedSort, setSelectedSort]
    )
    const sortDirectionGroups: GTMenuItem[] = useMemo(
        () => [
            {
                label: 'Ascending',
                icon: icons.arrow_ascend,
                selected: selectedSortDirection === SORT_DIRECTION.ASC,
                onClick: () => setSelectedSortDirection(SORT_DIRECTION.ASC),
            },
            {
                label: 'Descending',
                icon: icons.arrow_descend,
                selected: selectedSortDirection === SORT_DIRECTION.DESC,
                onClick: () => setSelectedSortDirection(SORT_DIRECTION.DESC),
            },
        ],
        [selectedSortDirection, setSelectedSortDirection]
    )
    const filterSelectorItems: GTMenuItem[] = useMemo(
        () =>
            Object.entries(filterOptions).map(([, value]) => ({
                ...value,
                selected: selectedFilter.id === value.id,
                icon: icons.filter,
                onClick: () => setSelectedFilter(value),
            })),
        [filterOptions, selectedFilter, setSelectedFilter]
    )
    const sortSelectorItems = [sortItems]
    if (!selectedSort.forceDirection) {
        sortSelectorItems.push(sortDirectionGroups)
    }
    const sortIcon = selectedSort.icon
        ? icons[selectedSort.icon]
        : selectedSortDirection === SORT_DIRECTION.ASC
        ? icons.arrow_ascend
        : icons.arrow_descend

    return (
        <SortAndFilterContainer>
            {filterSelectorItems.length > 0 && (
                <GTDropdownMenu
                    items={filterSelectorItems}
                    trigger={
                        <GTButton
                            icon={icons.filter}
                            value={selectedFilter.label}
                            size="small"
                            styleType="secondary"
                            asDiv
                        />
                    }
                />
            )}
            <GTDropdownMenu
                items={sortSelectorItems}
                trigger={
                    <GTButton
                        icon={sortIcon}
                        boldValue="Sort: "
                        value={sortOptions[selectedSort.id].label}
                        styleType="simple"
                        size="small"
                        asDiv
                    />
                }
            />
        </SortAndFilterContainer>
    )
}

export default SortAndFilterDropdowns
