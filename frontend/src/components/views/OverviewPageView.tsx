import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetOverviewViews, useGetSupportedViews } from '../../services/api/overview.hooks'
import { Colors, Spacing } from '../../styles'
import TaskDetails from '../details/TaskDetails'
import EditViewsButtons from '../overview/EditViewsButtons'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { TMeetingPreparationTask, TPullRequest, TTask } from '../../utils/types'
import Spinner from '../atoms/Spinner'
import PullRequestDetails from '../details/PullRequestDetails'
import { SectionHeader } from '../molecules/Header'
import EmptyDetails from '../details/EmptyDetails'
import { icons } from '../../styles/images'
import { useFetchPullRequests } from '../../services/api/pull-request.hooks'
import { useFetchExternalTasks } from '../../services/api/tasks.hooks'

const OverviewPageContainer = styled.div`
    display: flex;
    border-right: 1px solid ${Colors.background.dark};
`
const ActionsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: ${Spacing._8};
    gap: ${Spacing._16};
`

const OverviewView = () => {
    const { data: views, isLoading } = useGetOverviewViews()
    useFetchExternalTasks()
    useFetchPullRequests()
    const { overviewViewId, overviewItemId } = useParams()
    const navigate = useNavigate()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Prefetch supported views
    useGetSupportedViews()

    const selectFirstItem = () => {
        const firstNonEmptyView = views?.find((view) => view.view_items.length > 0)
        if (firstNonEmptyView) {
            navigate(`/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_items[0].id}`)
        }
    }

    const detailsView = useMemo(() => {
        if (!views?.length) {
            return <EmptyDetails icon={icons.list} text="You have no views" />
        }
        for (const view of views) {
            if (view.id !== overviewViewId) continue
            for (const item of view.view_items) {
                if (item.id !== overviewItemId) continue
                if (view.type === 'github') {
                    return <PullRequestDetails pullRequest={item as TPullRequest} />
                }
                if (view.type === 'meeting_preparation') {
                    const meetingTask = item as TMeetingPreparationTask
                    const startTime = new Date(meetingTask.datetime_start)
                    const endTime = new Date(meetingTask.datetime_end)
                    return (
                        <TaskDetails
                            task={item as TTask}
                            link={`/overview/${view.id}/${item.id}`}
                            isMeetingPreparation
                            startTime={startTime}
                            endTime={endTime}
                        />
                    )
                }
                return <TaskDetails task={item as TTask} link={`/overview/${view.id}/${item.id}`} />
            }
        }
        return null
    }, [overviewViewId, overviewItemId, views])

    // select first item if none is selected or invalid item is selected in url
    useEffect(() => {
        if (!isLoading && (!overviewViewId || !overviewItemId || !detailsView)) {
            selectFirstItem()
        }
    }, [isLoading, overviewViewId, overviewItemId])

    if (isLoading) {
        return <Spinner />
    } else if (!views) {
        return <div>No views yet</div>
    }

    return (
        <>
            <OverviewPageContainer>
                <ScrollableListTemplate ref={scrollRef}>
                    <SectionHeader sectionName="Overview" allowRefresh={true} />
                    <ActionsContainer>
                        <EditViewsButtons />
                    </ActionsContainer>
                    {views.map((view) => (
                        <OverviewViewContainer view={view} key={view.id} scrollRef={scrollRef} />
                    ))}
                </ScrollableListTemplate>
            </OverviewPageContainer>
            {detailsView}
        </>
    )
}

export default OverviewView
