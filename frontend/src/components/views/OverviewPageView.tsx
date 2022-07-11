import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { Spacing, Colors, Typography } from '../../styles'
import TaskDetails from '../details/TaskDetails'
import EditViewsButton from '../overview/EditViewsButton'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'
import ThreadDetails from '../details/ThreadDetails'
import { TEmailThread, TTask } from '../../utils/types'

const PageHeader = styled.div`
    padding: ${Spacing.padding._16};
    color: ${Colors.gray._500};
    font-size: ${Typography.small.fontSize};
    border-bottom: 2px solid ${Colors.gray._200};
`
const ActionsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
`
// placeholder for details view
const DetailsViewContainer = styled.div`
    background-color: ${Colors.white};
    padding-top: 50vh;
    min-width: 400px;
`

const OverviewView = () => {
    const { data: views } = useGetOverviewViews()
    const { overviewItem } = useParams()

    const detailsView = useMemo(() => {
        if (!views) {
            return null
        }
        for (const view of views) {
            for (const item of view.view_items) {
                if (item.id === overviewItem) {
                    if (view.type === 'message') {
                        return <ThreadDetails thread={item as TEmailThread} />
                    } else {
                        return <TaskDetails task={item as TTask} link={`/overview/${item.id}`} />
                    }
                }
            }
        }
        return null
    }, [overviewItem])

    return (
        <>
            <ScrollableListTemplate noTopPadding>
                <PageHeader>Overview</PageHeader>
                <ActionsContainer>
                    <EditViewsButton />
                </ActionsContainer>
                {views.map((view) => (
                    <OverviewViewContainer view={view} key={view.id} />
                ))}
            </ScrollableListTemplate>
            {detailsView}
        </>
    )
}

export default OverviewView
