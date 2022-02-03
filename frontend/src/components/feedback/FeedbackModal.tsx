import React from 'react'
import ReactDOM from 'react-dom'
import { FEEDBACK_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { ButtonContainer, FeedbackHeader, FeedbackModalButton, FeedbackSection, HeaderPrimary, HeaderSecondary, ModalContainer, SectionHeader, SectionResponse } from './FeedbackModal-style'

const modalRoot = document.getElementById('modal-root') as HTMLElement

const FeedbackModal = (): JSX.Element => {
    const dispatch = useAppDispatch()
    const placeholder = 'Type in your feedback here.'

    document.getElementById('root')?.style.setProperty('filter', 'blur(5px)')
    document.getElementById('root')?.style.setProperty('overflow', 'hidden')
    document.getElementById('modal-root')?.style.setProperty('width', '100%')
    document.getElementById('modal-root')?.style.setProperty('height', '100%')

    const [feedback, setFeedback] = React.useState('')
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFeedback(e.target.value)
    }
    const closeModal = () => {
        document.getElementById('root')?.style.removeProperty('filter')
        document.getElementById('root')?.style.removeProperty('overflow')
        document.getElementById('modal-root')?.style.setProperty('width', '0%')
        document.getElementById('modal-root')?.style.setProperty('height', '0%')
        dispatch(setShowModal(false))
    }
    const handleSubmit = async () => {
        await makeAuthorizedRequest({
            url: FEEDBACK_URL,
            method: 'POST',
            body: JSON.stringify({ feedback: feedback }),
        })
        closeModal()
    }

    const modal = (
        <ModalContainer>
            <FeedbackHeader>
                <HeaderPrimary>Got feedback?</HeaderPrimary>
                <HeaderSecondary>Let us know how we can improve!</HeaderSecondary>
            </FeedbackHeader>
            <FeedbackSection>
                <SectionHeader>Feedback</SectionHeader>
                <SectionResponse placeholder={placeholder} value={feedback} onChange={handleChange} />
            </FeedbackSection>
            <ButtonContainer>
                <FeedbackModalButton onClick={handleSubmit}>Send feedback</FeedbackModalButton>
                <FeedbackModalButton white onClick={closeModal}>Cancel</FeedbackModalButton>
            </ButtonContainer>
        </ModalContainer>
    )
    return ReactDOM.createPortal(modal, modalRoot)
}

export default FeedbackModal
