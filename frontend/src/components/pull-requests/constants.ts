import {
    FilterOptions,
    SORT_DIRECTION,
    SortAndFilterSettingsConfig,
    SortOptions,
} from '../../utils/sortAndFilter/types'
import { TPullRequest } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'

const ACTION_REVIEW_PR = 'Review PR'
const ACTION_ADD_REVIEWERS = 'Add Reviewers'
const ACTION_FIX_FAILED_CI = 'Fix Failed CI'
const ACTION_ADDRESS_COMMENTS = 'Address Comments'
const ACTION_FIX_MERGE_CONFLICTS = 'Fix Merge Conflicts'
const ACTION_WAITING_ON_CI = 'Waiting on CI'
const ACTION_MERGE_PR = 'Merge PR'
const ACTION_WAITING_ON_REVIEW = 'Waiting on Review'
const ACTION_WAITING_ON_AUTHOR = 'Waiting on Author'
const ACTION_NOT_ACTIONABLE = 'Not Actionable'

const PULL_REQUEST_REQUIRED_ACTIONS = [
    ACTION_REVIEW_PR,
    ACTION_ADD_REVIEWERS,
    ACTION_FIX_FAILED_CI,
    ACTION_ADDRESS_COMMENTS,
    ACTION_FIX_MERGE_CONFLICTS,
    ACTION_WAITING_ON_CI,
    ACTION_MERGE_PR,
    ACTION_WAITING_ON_REVIEW,
    ACTION_WAITING_ON_AUTHOR,
    ACTION_NOT_ACTIONABLE,
]

const NON_ACTIONABLE_REQUIRED_ACTIONS = new Set([
    ACTION_WAITING_ON_REVIEW,
    ACTION_WAITING_ON_AUTHOR,
    ACTION_NOT_ACTIONABLE,
])

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

export const PR_FILTER_OPTIONS: FilterOptions<TPullRequest> = {
    all_prs: {
        id: 'all_prs',
        label: 'All PRs',
        lambda: () => true,
    },
    actionable_only: {
        id: 'actionable_only',
        label: 'Actionable pull requests',
        lambda: (pr: TPullRequest) => !NON_ACTIONABLE_REQUIRED_ACTIONS.has(pr.status.text),
    },
}

export const PR_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TPullRequest> = {
    sortOptions: PR_SORT_SELECTOR_ITEMS,
    filterOptions: PR_FILTER_OPTIONS,
    sortPreferenceId: 'github_sorting_preference',
    sortDirectionId: 'github_sorting_direction',
    filterPreferenceId: 'github_filtering_preference',
    defaultSortsAndFilters: {
        sortOptions: PR_SORT_SELECTOR_ITEMS,
        filterOptions: PR_FILTER_OPTIONS,
        selectedSort: PR_SORT_SELECTOR_ITEMS.required_action,
        setSelectedSort: emptyFunction,
        selectedSortDirection: SORT_DIRECTION.DESC,
        setSelectedSortDirection: emptyFunction,
        selectedFilter: PR_FILTER_OPTIONS.all_prs,
        setSelectedFilter: emptyFunction,
        isLoading: true,
    },
}
