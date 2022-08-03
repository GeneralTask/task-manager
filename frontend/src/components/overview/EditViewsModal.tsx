import React, { useCallback } from 'react'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Border, Colors, Spacing } from '../../styles'
import GTModal from '../atoms/GTModal'
import GTButton from '../atoms/buttons/GTButton'
import styled from 'styled-components'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import EditViewsSelectedView from './EditViewsSelectedView'
import { useGetOverviewViews, useReorderViews } from '../../services/api/overview.hooks'
import { DropItem, DropType } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'
import Spinner from '../atoms/Spinner'

const AddViewsButton = styled(NoStyleButton)`
    border: ${Border.stroke.medium} solid ${Colors.background.dark};
    border-radius: ${Border.radius.large};
    color: ${Colors.text.light};
    display: flex;
    align-items: center;
    padding: ${Spacing.padding._8};
    gap: ${Spacing.margin._4};
`

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
                <AddViewsButton onClick={goToAddViewsView}>
                    <Icon source={icons.plus} size="small" />
                    Add views
                </AddViewsButton>
            }
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
