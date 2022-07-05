import React from 'react'
import { useDrag } from 'react-dnd'
import { logos, icons } from '../../styles/images'
import { DropType, TOverviewView } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { SelectedView, EditViewsDeleteButton } from './styles'

interface EditViewsSelectedViewProps {
    view: TOverviewView
    viewIndex: number
}
const EditViewsSelectedView = ({ view, viewIndex }: EditViewsSelectedViewProps) => {
    const [, drag] = useDrag(
        () => ({
            type: DropType.TASK,
            item: { id: view.id },
            collect: (monitor) => {
                const isDragging = !!monitor.isDragging()
                return { opacity: isDragging ? 0.5 : 1 }
            },
        }),
        [view.id]
    )
    return (
        <ReorderDropContainer key={view.id} index={viewIndex} acceptDropType={DropType.TASK} onReorder={emptyFunction}>
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
