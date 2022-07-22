import React, { useEffect, useMemo, useState } from 'react'
import { TOverviewView, TSourcesResult } from '../../utils/types'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'
import { ViewHeader, ViewContainer, PaginateTextButton, OptimisticItemsContainer } from './styles'
import ExternalViewItems from './viewItems/ExternalViewItems'
import Spinner from '../atoms/Spinner'
import AuthBanner from '../molecules/AuthBanner'
import PullRequestViewItems from './viewItems/PullRequestViewItems'

const PAGE_SIZE = 5

interface OverviewViewProps {
    view: TOverviewView
}
const OverviewView = ({ view }: OverviewViewProps) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(Math.min(view.view_items.length, PAGE_SIZE))
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
        setVisibleItemsCount(Math.min(view.view_items.length, PAGE_SIZE))
    }, [view.view_items])

    return (
        <ViewContainer>
            <ViewHeader>{view.name}</ViewHeader>
            {view.sources.map((source: TSourcesResult) => {
                if (!view.is_linked) {
                    return <AuthBanner name={source.name} authorization_url={source.authorization_url} />
                }
            })}
            <ViewItems view={view} visibleItemsCount={visibleItemsCount} />
            {visibleItemsCount < view.view_items.length && (
                <PaginateTextButton onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}>
                    View more ({nextPageLength})
                </PaginateTextButton>
            )}
        </ViewContainer>
    )
}

export default OverviewView
