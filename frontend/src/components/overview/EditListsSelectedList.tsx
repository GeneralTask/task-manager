import { useDrag } from 'react-dnd'
import { useRemoveView } from '../../services/api/overview.hooks'
import { icons, logos } from '../../styles/images'
import { DropItem, DropType, TOverviewView } from '../../utils/types'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { EditViewsDeleteButton, SelectedList } from './styles'

interface EditViewsSelectedViewProps {
    view: TOverviewView
    viewIndex: number
    onReorder: (item: DropItem, dropIndex: number) => void
}
const EditViewsSelectedView = ({ view, viewIndex, onReorder }: EditViewsSelectedViewProps) => {
    const [, drag, dragPreview] = useDrag(
        () => ({
            type: DropType.OVERVIEW_VIEW,
            item: { id: view.id, view },
        }),
        [view.id]
    )

    const { mutate: removeView } = useRemoveView()

    return (
        <ReorderDropContainer
            key={view.id}
            index={viewIndex}
            acceptDropType={DropType.OVERVIEW_VIEW}
            onReorder={onReorder}
            ref={drag}
        >
            <SelectedList key={view.id} ref={dragPreview}>
                <Domino />
                <Icon icon={logos[view.logo]} />
                {view.name}
                <EditViewsDeleteButton onClick={() => removeView({ id: view.id }, view.optimisticId)}>
                    <Icon icon={icons.trash} />
                </EditViewsDeleteButton>
            </SelectedList>
        </ReorderDropContainer>
    )
}

export default EditViewsSelectedView
