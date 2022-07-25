import React, { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { Spacing, Colors, Typography } from '../../styles'
import TaskDetails from '../details/TaskDetails'
import EditViewsButton from '../overview/EditViewsButton'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import { TPullRequest, TTask } from '../../utils/types'
import Spinner from '../atoms/Spinner'
import PullRequestDetails from '../details/PullRequestDetails'

const OverviewPageContainer = styled.div`
    display: flex;
    border-right: 1px solid ${Colors.background.dark};
`
const PageHeader = styled.div`
    padding: ${Spacing.padding._16};
    color: ${Colors.text.light};
    border-bottom: 2px solid ${Colors.background.dark};
    ${Typography.subtitle};
`
const ActionsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
`

const OverviewView = () => {
    const { data: views, isLoading } = useGetOverviewViews()
    const { overviewItem } = useParams()
    const navigate = useNavigate()

    const selectFirstItem = () => {
        const firstNonEmptyView = views?.find((view) => view.view_items.length > 0)
        if (firstNonEmptyView) {
            navigate(`/overview/${firstNonEmptyView.view_items[0].id}`)
        }
    }

    const detailsView = useMemo(() => {
        if (!views || !overviewItem) {
            return null
        }
        for (const view of views) {
            for (const item of view.view_items) {
                if (item.id === overviewItem) {
                    if (view.type === 'github') {
                        return <PullRequestDetails pullRequest={item as TPullRequest} />
                    } else {
                        return <TaskDetails task={item as TTask} link={`/overview/${item.id}`} />
                    }
                }
            }
        }
        return null
    }, [overviewItem, views])

    // select first item if none is selected or invalid item is selected in url
    useEffect(() => {
        if (!isLoading && (!overviewItem || !detailsView)) {
            selectFirstItem()
        }
    }, [])

    if (isLoading) {
        return <Spinner />
    } else if (!views) {
        return <div>No views yet</div>
    }

    return (
        <>
            <OverviewPageContainer>
                <ScrollableListTemplate noTopPadding>
                    <PageHeader>Overview</PageHeader>
                    <ActionsContainer>
                        <EditViewsButton />
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
