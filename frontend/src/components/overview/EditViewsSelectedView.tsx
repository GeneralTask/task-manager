import React, { useCallback } from 'react'
import { useDrag } from 'react-dnd'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { logos, icons } from '../../styles/images'
import { DropItem, DropType, TOverviewView } from '../../utils/types'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { SelectedView, EditViewsDeleteButton } from './styles'

interface EditViewsSelectedViewProps {
    view: TOverviewView
    viewIndex: number
}
const EditViewsSelectedView = ({ view, viewIndex }: EditViewsSelectedViewProps) => {
    const { temporaryReorderViews } = useGetOverviewViews()
    const [, drag] = useDrag(
        () => ({
            type: DropType.OVERVIEW_VIEW,
            item: { id: view.id },
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [view.id]
    )

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => temporaryReorderViews(item.id, dropIndex),
        []
    )

    return (
        <ReorderDropContainer
            key={view.id}
            index={viewIndex}
            acceptDropType={DropType.OVERVIEW_VIEW}
            onReorder={handleReorder}
        >
            <SelectedView key={view.id}>
                <Domino ref={drag} />
                <Icon source={logos[view.logo]} size="small" />
                {view.name}
                <EditViewsDeleteButton>
                    <Icon source={icons.x_thin} size="small" />
                </EditViewsDeleteButton>
            </SelectedView>
        </ReorderDropContainer>
    )
}

export default EditViewsSelectedView
