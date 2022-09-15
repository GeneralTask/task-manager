import { TFilterConfig, TPullRequest, TSortConfig } from '../../utils/types'

const PULL_REQUEST_REQUIRED_ACTIONS = [
    'Add Reviewers',
    'Fix Merge Conflicts',
    'Fix Failed CI',
    'Address Comments',
    'Waiting on CI',
    'Merge PR',
    'Waiting on Author',
    'Waiting on Review',
    'Review PR',
    'Not Actionable',
]

const requiredActionToIndexMap = new Map<string, number>(PULL_REQUEST_REQUIRED_ACTIONS.map((action, index) => [action, index]))

export const PR_SORT_SELECTOR_ITEMS: TSortConfig<TPullRequest> = {
    requiredAction: {
        label: 'Required action',
        sort: {
            id: 'requiredAction',
            customComparator: (a: TPullRequest, b: TPullRequest) => {
                const aPriority = requiredActionToIndexMap.get(a.status.text)
                const bPriority = requiredActionToIndexMap.get(b.status.text)
                if (aPriority === undefined || bPriority === undefined) return 0
                return bPriority - aPriority
            },
        },
    },
    prNumber: {
        label: 'PR number',
        sort: {
            id: 'prNumber',
            field: 'number',
        }
    },
    lastUpdated: {
        label: 'Last updated',
        sort: {
            id: 'lastUpdated',
            field: 'last_updated_at',
        }
    },
    createdAt: {
        label: 'Created at',
        sort: {
            id: 'createdAt',
            field: 'number',
        }
    },
}

export const PR_FILTER_ITEMS: TFilterConfig<TPullRequest> = {
    all_prs: {
        id: 'all_prs',
        label: 'All PRs',
        filter: () => true,
    },
    actionable_only: {
        id: 'actionable_only',
        label: 'Actionable pull requests',
        filter: (pr: TPullRequest) => pr.status.text !== 'Not Actionable'
    }
}
