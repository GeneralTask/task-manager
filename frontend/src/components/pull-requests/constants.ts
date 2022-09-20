import { TPullRequest } from '../../utils/types'
import { SortSelectorItems } from '../molecules/SortSelector'

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

export const PR_SORT_SELECTOR_ITEMS: SortSelectorItems<TPullRequest> = {
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
        },
    },
    lastUpdated: {
        label: 'Last updated',
        sort: {
            id: 'lastUpdated',
            field: 'last_updated_at',
        },
    },
    createdAt: {
        label: 'Created at',
        sort: {
            id: 'createdAt',
            field: 'number',
        },
    },
}
