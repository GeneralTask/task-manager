import { useState } from 'react'
import styled from 'styled-components'
import { useToast } from '../../hooks'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'
import { Subtitle } from '../atoms/subtitle/Subtitle'
import { TitleMedium } from '../atoms/title/Title'
import GTModal from '../mantine/GTModal'

const FEEDBACK_MIN_HEIGHT = 100

const FeedbackTextField = styled(GTTextField)`
    min-height: ${FEEDBACK_MIN_HEIGHT}px;
`

const FeedbackModal = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [feedback, setFeedback] = useState('')
    const { mutate: postFeedback } = usePostFeedback()
    const toast = useToast()
    const submitFeedback = () => {
        postFeedback({ feedback: feedback })
        setFeedback('')
        setModalIsOpen(false)
        toast.show(
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
        <>
            <GTButton
                value="Share feedback"
                styleType="secondary"
                size="small"
                fitContent={false}
                onClick={() => setModalIsOpen(true)}
            />
            <GTModal open={modalIsOpen} setOpen={setModalIsOpen}>
                <TitleMedium>Got feedback for us?</TitleMedium>
                <Subtitle>
                    Feedback is a gift — thank you. Let us know what things you’d like to see us do more and what things
                    we can do better.
                </Subtitle>
                <FeedbackTextField
                    type="plaintext"
                    value={feedback}
                    onChange={(val) => setFeedback(val)}
                    fontSize="small"
                    placeholder="Let us know your thoughts"
                    autoFocus
                />
                <Flex justifyContentSpaceBetween>
                    <GTButton onClick={() => setModalIsOpen(false)} value="Cancel" styleType="secondary" />
                    <GTButton onClick={submitFeedback} value="Send feedback" styleType="primary" />
                </Flex>
            </GTModal>
        </>
    )
}

export default FeedbackModal
