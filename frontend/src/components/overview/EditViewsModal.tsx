import React, { useCallback } from 'react'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Border, Colors, Spacing } from '../../styles'
import GTModal from '../atoms/GTModal'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import EditViewsSelectedView from './EditViewsSelectedView'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { DropItem, DropType } from '../../utils/types'
import ReorderDropContainer from '../atoms/ReorderDropContainer'

const AddViewsButton = styled(NoStyleButton)`
    border: 1px solid ${Colors.gray._500};
    border-radius: ${Border.radius.large};
    color: ${Colors.gray._500};
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
    const { data: views, temporaryReorderViews } = useGetOverviewViews()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => temporaryReorderViews(item.id, dropIndex),
        [temporaryReorderViews]
    )

    return (
        <GTModal
            isOpen={isOpen}
            title="Edit views"
            onClose={onClose}
            leftButtons={<RoundedGeneralButton value="Done" color={Colors.purple._1} onClick={onClose} />}
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
                    isLast
                />
            </>
        </GTModal>
    )
}

export default EditViewsModal
