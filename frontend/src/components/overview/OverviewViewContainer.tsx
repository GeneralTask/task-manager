import React, { useMemo } from 'react'
import { icons } from '../../styles/images'
import { TOverviewView } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskSectionViewItems from './viewItems/TaskSectionViewItems'
import { ViewHeader, ViewContainer, RemoveButton } from './styles'
import LinearViewItems from './viewItems/LinearViewItems'

interface OverviewViewProps {
    view: TOverviewView
}
const OverviewView = ({ view }: OverviewViewProps) => {
    const viewItems = useMemo(() => {
        switch (view.type) {
            case 'task_section':
                return <TaskSectionViewItems view={view} />
            case 'linear':
                return <LinearViewItems view={view} />
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
