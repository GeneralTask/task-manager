import React, { useEffect } from 'react'
import { FEEDBACK_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import {
    HeaderPrimary,
    HeaderSecondary,
    SectionHeader,
    ButtonContainer,
    ModalButton,
    ResponseContainer,
    ModalTextArea,
} from '../modal/ModalElements'
import { ModalContainer, FeedbackHeader } from './FeedbackModal-style'

const FeedbackModal = (): JSX.Element => {
    const dispatch = useAppDispatch()
    const placeholder = 'Type in your feedback here.'

    useEffect(() => {
        setFeedback(localStorage.getItem('feedbackResponse') || '')
    }, [])

    useEffect(() => {
        localStorage.setItem('feedbackResponse', feedback)
    })

    document.getElementById('root')?.style.setProperty('filter', 'blur(5px)')
    document.getElementById('root')?.style.setProperty('overflow', 'hidden')

    const [feedback, setFeedback] = React.useState('')
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFeedback(e.target.value)
    }
    const closeModal = () => {
        dispatch(setShowModal(false))
    }
    const handleSubmit = async () => {
        await makeAuthorizedRequest({
            url: FEEDBACK_URL,
            method: 'POST',
            body: JSON.stringify({ feedback: feedback }),
        })
        closeModal()
        localStorage.setItem('feedbackResponse', '')
    }

    return (
        <ModalContainer>
            <FeedbackHeader>
                <HeaderPrimary>Got feedback?</HeaderPrimary>
                <HeaderSecondary>Let us know how we can improve!</HeaderSecondary>
            </FeedbackHeader>
            <ResponseContainer>
                <SectionHeader>Feedback</SectionHeader>
                <ModalTextArea placeholder={placeholder} value={feedback} onChange={handleChange} />
            </ResponseContainer>
            <ButtonContainer>
                <ModalButton onClick={handleSubmit}>Send feedback</ModalButton>
                <ModalButton white onClick={closeModal}>
                    Cancel
                </ModalButton>
            </ButtonContainer>
        </ModalContainer>
    )
}

export default FeedbackModal
