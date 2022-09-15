import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sort } from '../../../hooks/useSortAndFilter'
import { icons } from '../../../styles/images'
import { SORT_ORDER } from '../../../utils/enums'
import { TPullRequest } from '../../../utils/types'
import GTDropdownMenu, { GTDropdownMenuItem } from '../../atoms/GTDropdownMenu'
import GTButton from '../../atoms/buttons/GTButton'
import SortSelector from '../../molecules/SortSelector'
import PullRequestList from '../../pull-requests/PullRequestList'
import { PR_FILTER_ITEMS, PR_SORT_SELECTOR_ITEMS } from '../../pull-requests/constants'
import { ActionButtons, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const PullRequestViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { overviewItemId } = useParams()
    const [sort, setSort] = useState<Sort<TPullRequest>>({
        ...PR_SORT_SELECTOR_ITEMS.requiredAction.sort,
        direction: SORT_ORDER.DESC,
    })
    const [filter, setFilter] = useState(PR_FILTER_ITEMS.all_prs)
    const filterDropdownItems: GTDropdownMenuItem[] = Object.entries(PR_FILTER_ITEMS).map(([, value]) => ({
        label: value.label,
        onClick: () => setFilter(value),
        selected: filter.id === value.id,
    }))
    return (
        <>
            <ViewName>{view.name}</ViewName>
            {view.view_items.length > 0 && (
                <ActionButtons>
                    <GTDropdownMenu
                        items={filterDropdownItems}
                        trigger={
                            <GTButton icon={icons.filter} value={filter.label} size="small" styleType="secondary" />
                        }
                    />
                    <SortSelector items={PR_SORT_SELECTOR_ITEMS} selectedSort={sort} setSelectedSort={setSort} />
                </ActionButtons>
            )}
            {view.view_items.length === 0 && view.is_linked && (
                <EmptyViewItem
                    header="You have no more pull requests!"
                    body="When new pull requests get assigned to you, they will appear here."
                />
            )}
            <PullRequestList
                pullRequests={view.view_items.slice(0, visibleItemsCount)}
                selectedPrId={overviewItemId}
                sort={sort}
                filter={filter.filter}
                overviewViewId={view.id}
            />
        </>
    )
}

export default PullRequestViewItems
