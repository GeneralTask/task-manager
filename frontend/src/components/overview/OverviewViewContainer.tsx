import React, { useMemo, useState } from 'react'
import { icons } from '../../styles/images'
import { TOverviewView } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'
import { ViewHeader, ViewContainer, RemoveButton, PaginateTextButton, OptimisticItemsContainer } from './styles'
import ExternalViewItems from './viewItems/ExternalViewItems'
import MessagesViewItems from './viewItems/MessagesViewItems'
import Spinner from '../atoms/Spinner'
import { useRemoveView } from '../../services/api/overview.hooks'

const PAGE_SIZE = 5

interface OverviewViewProps {
    view: TOverviewView
}
const OverviewView = ({ view }: OverviewViewProps) => {
    const [visibleItemsCount, setVisibleItemsCount] = useState(Math.min(view.view_items.length, PAGE_SIZE))
    const { mutate: removeView } = useRemoveView()

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
            case 'message':
                return MessagesViewItems
            default:
                return () => <div>[WIP]List of items for type {view.type}</div>
        }
    }, [view.type])

    return (
        <ViewContainer>
            <ViewHeader>
                {view.name}
                <RemoveButton onClick={() => removeView(view.id)}>
                    <Icon source={icons.x_thin} size="xSmall" />
                </RemoveButton>
            </ViewHeader>
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
