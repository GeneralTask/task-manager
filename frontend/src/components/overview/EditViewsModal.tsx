import React from 'react'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import useGetOverviewViews from './dummydata'
import { SelectedView, EditViewsDeleteButton } from './styles'
import { Colors } from '../../styles'
import GTModal from '../atoms/GTModal'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'

interface EditViewsModalProps {
    isOpen: boolean
    onClose: () => void
}
const EditViewsModal = ({ isOpen, onClose }: EditViewsModalProps) => {
    const { data: blocks } = useGetOverviewViews()
    return (
        <GTModal
            isOpen={isOpen}
            title="Edit views"
            onClose={onClose}
            leftButtons={<RoundedGeneralButton value="Done" color={Colors.purple._1} onClick={onClose} />}
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
