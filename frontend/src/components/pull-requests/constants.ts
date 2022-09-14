import { TPullRequest } from '../../utils/types'
import { SortSelectorItems } from '../molecules/SortSelector'

export const PR_SORT_SELECTOR_ITEMS: SortSelectorItems<TPullRequest> = {
    requiredAction: {
        label: 'Required action',
        sort: {
            id: 'requiredAction',
            customComparator: (a: TPullRequest, b: TPullRequest) => {
                return 1
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