import { useState } from 'react'
import styled from 'styled-components'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import { Spacing } from '../../styles'
import toast from '../../utils/toast'
import GTModal from '../atoms/GTModal'
import GTTextArea from '../atoms/GTTextField/GTTextField'
import GTButton from '../atoms/buttons/GTButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TitleSmall } from '../atoms/title/Title'

const FeedbackHeader = styled.div`
    margin-bottom: ${Spacing._24};
    display: flex;
    flex-direction: column;
`
const FeedbackTextArea = styled(GTTextArea)`
    flex: 1;
    margin: ${Spacing._4} 0;
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
                theme: 'dark',
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
            <FeedbackTextArea
                value={feedback}
                onChange={(val) => setFeedback(val)}
                fontSize="small"
                placeholder="Type in your feedback here."
                isFullHeight
                autoFocus
            />
        </GTModal>
    )
}

export default FeedbackView
