import React from 'react'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../atoms/GTModal'

interface AddViewsModalProps {
    isOpen: boolean
    onClose: () => void
}

const CalendarTriageModal = ({ isOpen, onClose }: AddViewsModalProps) => {
    return (
        <GTModal
            isOpen={isOpen}
            title="Schedule Tasks"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="large"
        >
            {/* <AddViewsModalContent /> */}
        </GTModal>
    )
}

export default CalendarTriageModal
