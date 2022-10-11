import { useDrag } from 'react-dnd'
import { useRemoveView } from '../../services/api/overview.hooks'
import { icons, logos } from '../../styles/images'
import { DropItem, DropType, TOverviewView } from '../../utils/types'
import Domino from '../atoms/Domino'
import { Icon } from '../atoms/Icon'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import { EditViewsDeleteButton, SelectedView } from './styles'

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

    const { mutate: removeView } = useRemoveView()

    return (
        <ReorderDropContainer
            key={view.id}
            index={viewIndex}
            acceptDropType={DropType.OVERVIEW_VIEW}
            onReorder={onReorder}
        >
            <SelectedView key={view.id} ref={dragPreview}>
                <Domino ref={drag} />
                <Icon icon={logos[view.logo]} />
                {view.name}
                <EditViewsDeleteButton onClick={() => removeView(view.id)}>
                    <Icon icon={icons.trash} />
                </EditViewsDeleteButton>
            </SelectedView>
        </ReorderDropContainer>
    )
}

export default EditViewsSelectedView
