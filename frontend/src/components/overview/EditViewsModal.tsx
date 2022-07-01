import React from 'react'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import useGetOverviewViews from './dummydata'
import { SelectedView, EditViewsDeleteButton } from './styles'
import { Border, Colors, Spacing } from '../../styles'
import GTModal from '../atoms/GTModal'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import styled from 'styled-components'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

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
    const { data: blocks } = useGetOverviewViews()
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
                {blocks.map((block) => (
                    <SelectedView key={block.id}>
                        <Icon source={logos[block.logo]} size="small" />
                        {block.name}
                        <EditViewsDeleteButton>
                            <Icon source={icons.x_thin} size="small" />
                        </EditViewsDeleteButton>
                    </SelectedView>
                ))}
            </>
        </GTModal>
    )
}

export default EditViewsModal
