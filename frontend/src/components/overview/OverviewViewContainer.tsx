import { OptimisticItemsContainer, PaginateTextButton, ViewContainer, ViewHeader } from './styles'
import React, { useEffect, useMemo, useState } from 'react'

import AuthBanner from './AuthBanner'
import ExternalViewItems from './viewItems/ExternalViewItems'
import PullRequestViewItems from './viewItems/PullRequestViewItems'
import Spinner from '../atoms/Spinner'
import { TOverviewView } from '../../utils/types'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'
import { useParams } from 'react-router-dom'

const PAGE_SIZE = 5

interface OverviewViewProps {
    view: TOverviewView
    scrollRef: React.RefObject<HTMLDivElement>
}
const OverviewView = ({ view, scrollRef }: OverviewViewProps) => {
    const { overviewViewId, overviewItemId } = useParams()
    const [visibleItemsCount, setVisibleItemsCount] = useState(
        Math.max(
            Math.min(view.view_items.length, PAGE_SIZE),
            // if the selected item is in this view, ensure it is visible
            view.id === overviewViewId ? view.view_items.findIndex((item) => item.id === overviewItemId) + 1 : 0
        )
    )

    // if a new item is selected in this view, ensure it is visible
    useEffect(() => {
        if (view.id === overviewViewId) {
            const selectedItemIndex = view.view_items.findIndex((item) => item.id === overviewItemId) + 1
            setVisibleItemsCount(Math.max(visibleItemsCount, selectedItemIndex))
        }
    }, [overviewViewId, overviewItemId, view.id])

    const nextPageLength = Math.min(view.view_items.length - visibleItemsCount, PAGE_SIZE)

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
            default:
                return () => <div>[WIP]List of items for type {view.type}</div>
        }
    }, [view.type])

    useEffect(() => {
        setVisibleItemsCount(Math.max(visibleItemsCount, Math.min(view.view_items.length, PAGE_SIZE)))
    }, [view.is_linked, view.view_items])

    return (
        <ViewContainer>
            <ViewHeader>{view.name}</ViewHeader>
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
            <ViewItems view={view} visibleItemsCount={visibleItemsCount} scrollRef={scrollRef} />
            {visibleItemsCount < view.view_items.length && (
                <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                    View more ({nextPageLength})
                </PaginateTextButton>
            )}
        </ViewContainer>
    )
}

export default OverviewView
