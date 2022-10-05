import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useParams } from 'react-router-dom'
import { DropType, TOverviewView } from '../../utils/types'
import Spinner from '../atoms/Spinner'
import AuthBanner from './AuthBanner'
import { OptimisticItemsContainer, PaginateTextButton, ViewContainer } from './styles'
import DueTodayViewItems from './viewItems/DueTodayViewItems'
import ExternalViewItems from './viewItems/ExternalViewItems'
import MeetingPreparationViewItems from './viewItems/MeetingPreparationViewItems'
import PullRequestViewItems from './viewItems/PullRequestViewItems'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'

const PAGE_SIZE = 5

interface OverviewViewProps {
    view: TOverviewView
    scrollRef: React.RefObject<HTMLDivElement>
}
const OverviewView = ({ view, scrollRef }: OverviewViewProps) => {
    const { overviewViewId, overviewItemId } = useParams()
    const [visibleItemsCount, setVisibleItemsCount] = useState(0)
    const [numViewItems, setNumViewItems] = useState(view.view_items.length)
    const nextPageLength = Math.min(numViewItems - visibleItemsCount, PAGE_SIZE)

    const ViewItems = useMemo(() => {
        if (view.isOptimistic) {
            return () => (
                <OptimisticItemsContainer>
                    <Spinner />
                </OptimisticItemsContainer>
            )
        }
        switch (view.type) {
            case 'task_section':
                return TaskSectionViewItems
            case 'linear':
            case 'slack':
                return ExternalViewItems
            case 'github':
                return PullRequestViewItems
            case 'meeting_preparation':
                return MeetingPreparationViewItems
            case 'due_today':
                return DueTodayViewItems
            default:
                return () => <div>[WIP]List of items for type {view.type}</div>
        }
    }, [view.type])

    useLayoutEffect(() => {
        setVisibleItemsCount(
            Math.max(
                // Ensure that visibleItemsCount <= numViewItems, and that we do not decrease the number of visible items when selecting a new item
                Math.min(visibleItemsCount, numViewItems),
                // If numViewItems drops below PAGE_SIZE, set visibleItemsCount to numViewItems
                Math.min(numViewItems, PAGE_SIZE),
                // if the selected item is in this view, ensure it is visible
                view.id === overviewViewId ? view.view_items.findIndex((item) => item.id === overviewItemId) + 1 : 0
            )
        )
    }, [view.is_linked, view.view_items, overviewViewId, overviewItemId])

    const [, drag, dragPreview] = useDrag(() => ({
        type: DropType.OVERVIEW_VIEW_HEADER,
        item: { view },
        collect: (monitor) => monitor.isDragging(),
    }))
    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true })
    }, [dragPreview])
    if (view.id === '633debb64bca27e870eb6a80') console.log({ nextPageLength, visibleItemsCount, numViewItems })

    return (
        <ViewContainer>
            <ViewItems
                ref={drag}
                view={view}
                visibleItemsCount={visibleItemsCount}
                scrollRef={scrollRef}
                setNumViewItems={setNumViewItems}
            />
            {!view.is_linked &&
                view.sources.map((source) => (
                    <AuthBanner
                        key={source.name}
                        authorizationUrl={source.authorization_url}
                        name={source.name}
                        logo={view.logo}
                        hasBorder={true}
                    />
                ))}
            {visibleItemsCount < numViewItems && (
                <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                    View more ({nextPageLength})
                </PaginateTextButton>
            )}
        </ViewContainer>
    )
}

export default OverviewView
