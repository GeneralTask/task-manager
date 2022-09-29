import styled from 'styled-components'
import GTButton from '../../components/atoms/buttons/GTButton'
import SortSelector from '../../components/molecules/SortSelector'
import GTDropdownMenu from '../../components/radix/GTDropdownMenu'
import { GTMenuItem } from '../../components/radix/RadixUIConstants'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { SortAndFilterSettings } from './types'

const SortAndFilterContainer = styled.div`
    display: flex;
    gap: ${Spacing._8};
    margin-bottom: ${Spacing._16};
`

interface SortAndFilterDropdownsProps<T> {
    settings: SortAndFilterSettings<T>
}

const SortAndFilterDropdowns = <T,>({ settings }: SortAndFilterDropdownsProps<T>) => {
    const {
        sortOptions,
        filterOptions,
        selectedSort,
        setSelectedSort,
        selectedSortDirection,
        setSelectedSortDirection,
        selectedFilter,
        setSelectedFilter,
    } = settings
    const filterSelectorItems: GTMenuItem[] = Object.entries(filterOptions).map(([, value]) => ({
        ...value,
        selected: selectedFilter.id === value.id,
        icon: icons.priority_urgent,
        onClick: () => setSelectedFilter(value),
    }))
    return (
        <SortAndFilterContainer>
            <GTDropdownMenu
                items={filterSelectorItems}
                trigger={
                    <GTButton icon={icons.filter} value={selectedFilter.label} size="small" styleType="secondary" />
                }
            />
            <SortSelector
                sortOptions={sortOptions}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
                selectedSortDirection={selectedSortDirection}
                setSelectedSortDirection={setSelectedSortDirection}
            />
        </SortAndFilterContainer>
    )
}

export default SortAndFilterDropdowns
