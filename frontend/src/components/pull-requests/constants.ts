import { SORT_DIRECTION, SortAndFilterSettingsConfig, SortOptions } from '../../utils/sortAndFilter/types'
import { TPullRequest } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'

const PULL_REQUEST_REQUIRED_ACTIONS = [
    'Review PR',
    'Add Reviewers',
    'Fix Failed CI',
    'Address Comments',
    'Fix Merge Conflicts',
    'Waiting on CI',
    'Merge PR',
    'Waiting on Review',
    'Waiting on Author',
    'Not Actionable',
]

const requiredActionToIndexMap = new Map<string, number>(
    PULL_REQUEST_REQUIRED_ACTIONS.map((action, index) => [action, index])
)

export const PR_SORT_SELECTOR_ITEMS: SortOptions<TPullRequest> = {
    required_action: {
        id: 'required_action',
        label: 'Required action',
        customComparator: (a: TPullRequest, b: TPullRequest) => {
            const aPriority = requiredActionToIndexMap.get(a.status.text)
            const bPriority = requiredActionToIndexMap.get(b.status.text)
            if (aPriority === undefined || bPriority === undefined) return 0
            return bPriority - aPriority
        },
    },
    pr_number: {
        id: 'pr_number',
        label: 'PR number',
        field: 'number',
    },
    updated_at: {
        id: 'updated_at',
        label: 'Last updated',
        field: 'last_updated_at',
    },
    created_at: {
        id: 'created_at',
        label: 'Created at',
        field: 'number',
    },
}

export const PR_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TPullRequest> = {
    sortOptions: PR_SORT_SELECTOR_ITEMS,
    sortPreferenceId: 'github_sorting_preference',
    sortDirectionId: 'github_sorting_direction',
    defaultSortsAndFilters: {
        sortOptions: PR_SORT_SELECTOR_ITEMS,
        selectedSort: PR_SORT_SELECTOR_ITEMS.required_action,
        setSelectedSort: emptyFunction,
        selectedSortDirection: SORT_DIRECTION.DESC,
        setSelectedSortDirection: emptyFunction,
    },
}
