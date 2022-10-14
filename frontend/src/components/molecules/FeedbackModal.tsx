import { useState } from 'react'
import styled from 'styled-components'
import { useToast } from '../../hooks'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import { Spacing } from '../../styles'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TitleLarge, TitleSmall } from '../atoms/title/Title'
import GTModal from '../mantine/GTModal'

const FeedbackTextField = styled(GTTextField)`
    flex: 1;
    margin: ${Spacing._4} 0;
`
const FeedbackTextFieldContainer = styled.div`
    display: flex;
    height: 300px;
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
                <TitleLarge>Got Feedback?</TitleLarge>
                <SubtitleSmall>Let us know how we can improve!</SubtitleSmall>
                <FeedbackTextFieldContainer>
                    <FeedbackTextField
                        type="plaintext"
                        value={feedback}
                        onChange={(val) => setFeedback(val)}
                        fontSize="small"
                        placeholder="Type in your feedback here."
                        isFullHeight
                        autoFocus
                    />
                </FeedbackTextFieldContainer>
                <Flex justifyContentSpaceBetween>
                    <GTButton onClick={() => setModalIsOpen(false)} value="Cancel" styleType="secondary" />
                    <GTButton onClick={submitFeedback} value="Send feedback" styleType="primary" />
                </Flex>
            </GTModal>
        </>
    )
}

export default FeedbackModal
