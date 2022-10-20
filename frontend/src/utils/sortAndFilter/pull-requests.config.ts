import { TPullRequest } from '../types'
import { emptyFunction } from '../utils'
import { FilterOptions, SORT_DIRECTION, SortAndFilterSettingsConfig, SortOptions } from './types'

const ACTION_REVIEW_PR = { text: 'Review PR', description: 'You have been added as a requested reviewer for the PR' }
const ACTION_ADD_REVIEWERS = {
    text: 'Add Reviewers',
    description: 'You have not yet requested any reviewers for the PR',
}
const ACTION_FIX_FAILED_CI = {
    text: 'Fix Failed CI',
    description: 'The CI build has failed and needs fixing before the PR should be merged',
}
const ACTION_ADDRESS_COMMENTS = {
    text: 'Address Comments',
    description: 'Your PR has requested changes which need to be addressed',
}
const ACTION_FIX_MERGE_CONFLICTS = {
    text: 'Fix Merge Conflicts',
    description: 'Your PR has merge conflicts that need fixing before it can be merged',
}
const ACTION_WAITING_ON_CI = { text: 'Waiting on CI', description: 'The CI is currently still running' }
const ACTION_MERGE_PR = {
    text: 'Merge PR',
    description: 'The PR is approved and has a passing CI and is therefore ready to be merged',
}
const ACTION_WAITING_ON_REVIEW = {
    text: 'Waiting on Review',
    description: 'Your PR has not been reviewed by the requested reviewers',
}
const ACTION_WAITING_ON_AUTHOR = {
    text: 'Waiting on Author',
    description: 'You have already given your review for the PR and are now waiting on the author to update the PR',
}
const ACTION_NOT_ACTIONABLE = {
    text: 'Not Actionable',
    description: 'You are neither the owner nor a requested reviewer for the PR',
}

export const PULL_REQUEST_ACTIONS = [
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

const PULL_REQUEST_REQUIRED_ACTIONS = [
    ACTION_REVIEW_PR.text,
    ACTION_ADD_REVIEWERS.text,
    ACTION_FIX_FAILED_CI.text,
    ACTION_ADDRESS_COMMENTS.text,
    ACTION_FIX_MERGE_CONFLICTS.text,
    ACTION_WAITING_ON_CI.text,
    ACTION_MERGE_PR.text,
    ACTION_WAITING_ON_REVIEW.text,
    ACTION_WAITING_ON_AUTHOR.text,
    ACTION_NOT_ACTIONABLE.text,
]

const NON_ACTIONABLE_REQUIRED_ACTIONS = new Set([
    ACTION_WAITING_ON_REVIEW.text,
    ACTION_WAITING_ON_AUTHOR.text,
    ACTION_NOT_ACTIONABLE.text,
    ACTION_WAITING_ON_CI.text,
])

const requiredActionToIndexMap = new Map<string, number>(
    PULL_REQUEST_REQUIRED_ACTIONS.map((action, index) => [action, index])
)

export const PR_SORT_SELECTOR_ITEMS: SortOptions<TPullRequest> = {
    required_action: {
        id: 'required_action',
        label: 'Required action',
        field: 'status',
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
        label: 'Actionable PRs',
        lambda: (pr: TPullRequest) => !NON_ACTIONABLE_REQUIRED_ACTIONS.has(pr.status.text),
    },
}

export const PR_SORT_AND_FILTER_CONFIG: SortAndFilterSettingsConfig<TPullRequest> = {
    sortOptions: PR_SORT_SELECTOR_ITEMS,
    filterOptions: PR_FILTER_OPTIONS,
    sortPreferenceId: 'github_sorting_preference',
    sortDirectionId: 'github_sorting_direction',
    filterPreferenceId: 'github_filtering_preference',
    tieBreakerField: 'number',
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
