import React, { useCallback } from 'react'
import GTModal from '../atoms/GTModal'
import GTButton from '../atoms/buttons/GTButton'
import EditViewsSelectedView from './EditViewsSelectedView'
import { useGetOverviewViews, useReorderViews } from '../../services/api/overview.hooks'
import { DropItem, DropType } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Spinner from '../atoms/Spinner'

interface EditViewsModalProps {
    isOpen: boolean
    onClose: () => void
    goToAddViewsView: () => void
}
const EditViewsModal = ({ isOpen, onClose, goToAddViewsView }: EditViewsModalProps) => {
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
            title="Edit views"
            onClose={onClose}
            leftButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            rightButtons={
                <GTButton onClick={goToAddViewsView} iconSource="plus" value="Add views" styleType="secondary" />
            }
            type="small"
        >
            <>
                {views.map((view, index) => (
                    <EditViewsSelectedView key={view.id} view={view} viewIndex={index} onReorder={handleReorder} />
                ))}
                <ReorderDropContainer
                    index={views.length}
                    acceptDropType={DropType.OVERVIEW_VIEW}
                    onReorder={handleReorder}
                    isLast
                />
            </>
        </GTModal>
    )
}

export default EditViewsModal
