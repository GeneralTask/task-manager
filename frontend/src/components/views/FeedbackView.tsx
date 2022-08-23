import { Border, Colors, Spacing } from '../../styles'
import React, { useState } from 'react'
import { TitleSmall } from '../atoms/title/Title'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import TextArea from '../atoms/TextArea'
import styled from 'styled-components'
import GTModal from '../atoms/GTModal'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import GTButton from '../atoms/buttons/GTButton'
import toast from '../../utils/toast'

const FeedbackHeader = styled.div`
    margin-bottom: ${Spacing.margin._24};
    display: flex;
    flex-direction: column;
`
const TextAreaContainer = styled.div`
    flex: 1;
    margin: ${Spacing.margin._4} 0;
    border: ${Border.stroke.medium} solid ${Colors.background.dark};
    border-radius: ${Border.radius.small};
`
interface FeedbackViewProps {
    modalIsOpen: boolean
    setModalIsOpen: (modalIsOpen: boolean) => void
}
const FeedbackView = ({ modalIsOpen, setModalIsOpen }: FeedbackViewProps) => {
    const [feedback, setFeedback] = useState('')
    const { mutate: postFeedback } = usePostFeedback()
    const submitFeedback = () => {
        postFeedback({ feedback: feedback })
        setFeedback('')
        setModalIsOpen(false)
        toast(
            {
                message: 'Thank you for your feedback',
            },
            {
                autoClose: 2000,
            }
        )
    }
    return (
        <GTModal
            isOpen={modalIsOpen}
            canClose={false}
            onClose={() => setModalIsOpen(false)}
            rightButtons={<GTButton onClick={submitFeedback} value="Send feedback" styleType="primary" />}
            leftButtons={<GTButton onClick={() => setModalIsOpen(false)} value="Cancel" styleType="secondary" />}
            title="Got Feedback?"
            type="small"
        >
            <FeedbackHeader>
                <SubtitleSmall>Let us know how we can improve!</SubtitleSmall>
            </FeedbackHeader>
            <TitleSmall>Feedback</TitleSmall>
            <TextAreaContainer>
                <TextArea value={feedback} placeholder="Type in your feedback here." setValue={setFeedback} />
            </TextAreaContainer>
        </GTModal>
    )
}

export default FeedbackView
