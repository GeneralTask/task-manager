import { useMemo } from 'react'
import Spinner from '../components/atoms/Spinner'
import { OptimisticItemsContainer } from '../components/overview/styles'
import DueTodayViewItems from '../components/overview/viewItems/DueTodayViewItems'
import ExternalViewItems from '../components/overview/viewItems/ExternalViewItems'
import LinearViewItems from '../components/overview/viewItems/LinearViewItems'
import MeetingPreparationViewItems from '../components/overview/viewItems/MeetingPreparationViewItems'
import PullRequestViewItems from '../components/overview/viewItems/PullRequestViewItems'
import TaskSectionViewItems from '../components/overview/viewItems/TaskSectionViewItems'
import { TOverviewView } from '../utils/types'

const useGetViewItems = (list: TOverviewView) => {
    return useMemo(() => {
        if (list.optimisticId) {
            return () => (
                <OptimisticItemsContainer>
                    <Spinner />
                </OptimisticItemsContainer>
            )
        }
        switch (list.type) {
            case 'task_section':
                return TaskSectionViewItems
            case 'linear':
                return LinearViewItems
            case 'slack':
            case 'jira':
                return ExternalViewItems
            case 'github':
                return PullRequestViewItems
            case 'meeting_preparation':
                return MeetingPreparationViewItems
            case 'due_today':
                return DueTodayViewItems
            default:
                return () => <div>[WIP]List of items for type {list.type}</div>
        }
    }, [list.type])
}

export default useGetViewItems
