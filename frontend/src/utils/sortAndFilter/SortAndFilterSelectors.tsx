import { useMemo } from 'react'
import styled from 'styled-components'
import { TIconType } from '../../components/atoms/Icon'
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
                icon: icons.priority_urgent,
                onClick: () => setSelectedSort(value),
            })),
        [sortOptions, selectedSort, setSelectedSort]
    )
    const sortDirectionGroups: GTMenuItem[] = useMemo(
        () => [
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
        ],
        [selectedSortDirection, setSelectedSortDirection]
    )
    const filterSelectorItems: GTMenuItem[] = useMemo(
        () =>
            Object.entries(filterOptions).map(([, value]) => ({
                ...value,
                selected: selectedFilter.id === value.id,
                icon: icons.priority_urgent,
                onClick: () => setSelectedFilter(value),
            })),
        [filterOptions, selectedFilter, setSelectedFilter]
    )
    const sortSelectorItems = [sortItems]
    if (!selectedSort.forceAndHideDirection) {
        sortSelectorItems.push(sortDirectionGroups)
    }
    let sortIcon: TIconType | undefined
    if (!selectedSort.forceAndHideDirection) {
        sortIcon = selectedSortDirection === SORT_DIRECTION.ASC ? icons.arrow_up : icons.arrow_down
    }

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
                        value={sortOptions[selectedSort.id].label}
                        styleType="secondary"
                        size="small"
                        asDiv
                    />
                }
            />
        </SortAndFilterContainer>
    )
}

export default SortAndFilterDropdowns
