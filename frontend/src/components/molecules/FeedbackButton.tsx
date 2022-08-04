import React, { useState } from 'react'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../atoms/GTModal'
import FeedbackView from '../views/FeedbackView'

const FeedbackButton = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [feedback, setFeedback] = useState('')
    const { mutate: postFeedback } = usePostFeedback()
    const submitFeedback = () => {
        postFeedback({ feedback: feedback })
    }
    return (
        <>
            <GTButton value="Share feedback" styleType="secondary" onClick={() => setModalIsOpen(true)} />
            <GTModal
                isOpen={modalIsOpen}
                canClose={false}
                onClose={() => setModalIsOpen(false)}
                rightButtons={<GTButton onClick={submitFeedback} value="Send feedback" styleType="primary" />}
                leftButtons={<GTButton onClick={() => setModalIsOpen(false)} value="Cancel" styleType="secondary" />}
                title="Got Feedback?"
            >
                <FeedbackView feedback={feedback} setFeedback={setFeedback} />
            </GTModal>
        </>
    )
}

export default FeedbackButton
