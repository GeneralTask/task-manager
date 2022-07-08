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
    const viewItems = useMemo(() => {
        switch (view.type) {
            case OverviewViewType.TASK_SECTION:
                return <TaskSectionViewItems view={view} />
            case OverviewViewType.LINEAR:
            case OverviewViewType.SLACK:
                return <ExternalViewItems view={view} />
            default:
                return <div>[WIP]List of items for type {view.type}</div>
        }
    }, [view])

    return (
        <ViewContainer>
            <ViewHeader>
                {view.name}
                <RemoveButton>
                    <Icon source={icons.x_thin} size="xSmall" />
                </RemoveButton>
            </ViewHeader>
            {viewItems}
        </ViewContainer>
    )
}

export default OverviewView
