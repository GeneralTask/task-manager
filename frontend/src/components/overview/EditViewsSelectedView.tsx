import React from 'react'
import { useDrag } from 'react-dnd'
import { logos, icons } from '../../styles/images'
import { DropItem, DropType, TOverviewView } from '../../utils/types'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { SelectedView, EditViewsDeleteButton } from './styles'

interface EditViewsSelectedViewProps {
    view: TOverviewView
    viewIndex: number
    onReorder: (item: DropItem, dropIndex: number) => void
}
const EditViewsSelectedView = ({ view, viewIndex, onReorder }: EditViewsSelectedViewProps) => {
    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.OVERVIEW_VIEW,
            item: { id: view.id },
        }),
        [view.id]
    )

    return (
        <ReorderDropContainer
            key={view.id}
            index={viewIndex}
            acceptDropType={DropType.OVERVIEW_VIEW}
            onReorder={onReorder}
        >
            <SelectedView key={view.id} ref={dragPreview}>
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
