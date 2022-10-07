import { useCallback } from 'react'
import { useGetOverviewViews, useReorderViews } from '../../services/api/overview.hooks'
import { DropItem, DropType } from '../../utils/types'
import GTModal from '../atoms/GTModal'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import EditViewsSelectedView from './EditViewsSelectedView'

interface EditViewsModalProps {
    isOpen: boolean
    onClose: () => void
}
const EditViewsModal = ({ isOpen, onClose }: EditViewsModalProps) => {
    const { data: views, isLoading } = useGetOverviewViews()
    const { mutate: reorderViews } = useReorderViews()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => reorderViews({ viewId: item.id, idOrdering: dropIndex }),
        [reorderViews]
    )

    if (isLoading) {
        return <Spinner />
    } else if (!views) {
        return <div>No views yet</div>
    }

    return (
        <GTModal
            isOpen={isOpen}
            title="Edit lists"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="medium"
        >
            <>
                {views.map((view, index) => (
                    <EditViewsSelectedView key={view.id} view={view} viewIndex={index} onReorder={handleReorder} />
                ))}
                <ReorderDropContainer
                    index={views.length}
                    acceptDropType={DropType.OVERVIEW_VIEW}
                    onReorder={handleReorder}
                    indicatorType="TOP_ONLY"
                />
            </>
        </GTModal>
    )
}

export default EditViewsModal
