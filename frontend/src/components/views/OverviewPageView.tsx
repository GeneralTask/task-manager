import React, { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { Colors, Spacing } from '../../styles'
import TaskDetails from '../details/TaskDetails'
import EditViewsButtons from '../overview/EditViewsButtons'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { TPullRequest, TTask } from '../../utils/types'
import Spinner from '../atoms/Spinner'
import PullRequestDetails from '../details/PullRequestDetails'
import { SectionHeader } from '../molecules/Header'
import EmptyDetails from '../details/EmptyDetails'
import { icons } from '../../styles/images'

const OverviewPageContainer = styled.div`
    display: flex;
    border-right: 1px solid ${Colors.background.dark};
`
const ActionsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: ${Spacing.margin._8};
    gap: ${Spacing.margin._16};
`

const OverviewView = () => {
    const { data: views, refetch, isLoading, isFetching } = useGetOverviewViews()
    const { overviewViewId, overviewItemId } = useParams()
    const navigate = useNavigate()

    const selectFirstItem = () => {
        const firstNonEmptyView = views?.find((view) => view.view_items.length > 0)
        if (firstNonEmptyView) {
            console.log({ linkTo: `/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_items[0].id}` })
            navigate(`/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_items[0].id}`)
        }
    }

    const detailsView = useMemo(() => {
        if (!views?.length) {
            return <EmptyDetails iconSource={icons.list} text="You have no views" />
        }
        for (const view of views) {
            if (view.id === overviewViewId) {
                for (const item of view.view_items) {
                    if (item.id === overviewItemId) {
                        if (view.type === 'github') {
                            return <PullRequestDetails pullRequest={item as TPullRequest} />
                        } else {
                            return <TaskDetails task={item as TTask} link={`/overview/${view.id}/${item.id}`} />
                        }
                    }
                }
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
                <ScrollableListTemplate>
                    <SectionHeader
                        sectionName="Overview"
                        allowRefresh={true}
                        refetch={refetch}
                        isRefreshing={isFetching}
                    />
                    <ActionsContainer>
                        <EditViewsButtons />
                    </ActionsContainer>
                    {views.map((view) => (
                        <OverviewViewContainer view={view} key={view.id} />
                    ))}
                </ScrollableListTemplate>
            </OverviewPageContainer>
            {detailsView}
        </>
    )
}

export default OverviewView
