import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetSupportedViews } from '../../services/api/overview.hooks'
import { useFetchPullRequests } from '../../services/api/pull-request.hooks'
import { useGetSettings } from '../../services/api/settings.hooks'
import { useFetchExternalTasks } from '../../services/api/tasks.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TPullRequest, TTask } from '../../utils/types'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import EmptyDetails from '../details/EmptyDetails'
import PullRequestDetails from '../details/PullRequestDetails'
import TaskDetails from '../details/TaskDetails'
import { SectionHeader } from '../molecules/Header'
import EditModal from '../overview/EditModal'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import useOverviewLists from '../overview/useOverviewLists'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const OverviewPageContainer = styled.div`
    display: flex;
`
const ActionsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: ${Spacing._8};
    gap: ${Spacing._16};
`

const OverviewView = () => {
    const [isEditListsModalOpen, setIsEditListsModalOpen] = useState(false)
    const { lists: views, isLoading } = useOverviewLists()
    const { isLoading: areSettingsLoading } = useGetSettings()
    useFetchExternalTasks()
    useFetchPullRequests()
    const { overviewViewId, overviewItemId, subtaskId } = useParams()
    const navigate = useNavigate()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Prefetch supported views
    useGetSupportedViews()

    const selectFirstItem = () => {
        const firstNonEmptyView = views?.find((view) => view.view_items.length > 0)
        if (firstNonEmptyView) {
            navigate(`/overview/${firstNonEmptyView.id}/${firstNonEmptyView.view_items[0].id}`, { replace: true })
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
                const subtask = (item as TTask).sub_tasks?.find((subtask) => subtask.id === subtaskId)
                const detailsLink = subtask
                    ? `/overview/${view.id}/${item.id}/${subtask.id}`
                    : `/overview/${view.id}/${item.id}/`
                return <TaskDetails task={item as TTask} subtask={subtask} link={detailsLink} />
            }
        }
        return null
    }, [overviewViewId, overviewItemId, subtaskId, views])

    // select first item if none is selected or invalid item is selected in url
    useEffect(() => {
        if (!isLoading && (!overviewViewId || !overviewItemId || !detailsView)) {
            selectFirstItem()
        }
        // check that selected item is in list of views
        for (const view of views) {
            if (view.id === overviewViewId) {
                for (const item of view.view_items) {
                    if (item.id === overviewItemId) {
                        return
                    }
                }
            }
        }
        selectFirstItem()
    }, [isLoading, overviewViewId, overviewItemId, views])

    if (isLoading || areSettingsLoading) {
        return <Spinner />
    } else if (!views) {
        return <div>No views yet</div>
    }

    return (
        <>
            <OverviewPageContainer>
                <ScrollableListTemplate ref={scrollRef}>
                    <SectionHeader sectionName="Overview" />
                    <ActionsContainer>
                        <GTButton
                            styleType="simple"
                            size="small"
                            onClick={() => setIsEditListsModalOpen(true)}
                            icon={icons.squarePlus}
                            iconColor="gray"
                            value="Edit lists"
                        />
                    </ActionsContainer>
                    {views.map((view) => (
                        <OverviewViewContainer view={view} key={view.id} scrollRef={scrollRef} />
                    ))}
                </ScrollableListTemplate>
            </OverviewPageContainer>
            {detailsView}
            <EditModal isOpen={isEditListsModalOpen} setisOpen={setIsEditListsModalOpen} />
        </>
    )
}

export default OverviewView
