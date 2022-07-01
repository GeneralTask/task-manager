import React from 'react'
import { Colors } from '../../styles'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import GTModal from '../atoms/GTModal'

interface AddViewsModalProps {
    isOpen: boolean
    onClose: () => void
}
const AddViewsModal = ({ isOpen, onClose }: AddViewsModalProps) => {
    return (
        <GTModal
            isOpen={isOpen}
            title="Add views"
            onClose={onClose}
            leftButtons={<RoundedGeneralButton value="Done" color={Colors.purple._1} onClick={onClose} />}
        >
            <div>hi</div>
        </GTModal>
    )
}

export default AddViewsModal
