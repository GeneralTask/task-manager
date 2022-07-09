import React, { useMemo } from 'react'
import { icons } from '../../styles/images'
import { OverviewViewType, TOverviewView } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'
import { ViewHeader, ViewContainer, RemoveButton } from './styles'
import ExternalViewItems from './viewItems/ExternalViewItems'

interface OverviewViewProps {
    view: TOverviewView
}
const OverviewView = ({ view }: OverviewViewProps) => {
    const ViewItems = useMemo(() => {
        switch (view.type) {
            case OverviewViewType.TASK_SECTION:
                return TaskSectionViewItems
            case OverviewViewType.LINEAR:
            case OverviewViewType.SLACK:
                return ExternalViewItems
            default:
                return () => <div>[WIP]List of items for type {view.type}</div>
        }
    }, [view.type])

    return (
        <ViewContainer>
            <ViewHeader>
                {view.name}
                <RemoveButton>
                    <Icon source={icons.x_thin} size="xSmall" />
                </RemoveButton>
            </ViewHeader>
            <ViewItems view={view} visibleItemsCount={5} />
        </ViewContainer>
    )
}

export default OverviewView
