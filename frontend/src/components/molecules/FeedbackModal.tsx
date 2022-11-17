import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useKeyboardShortcut, useToast } from '../../hooks'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import { icons } from '../../styles/images'
import GTTextField from '../atoms/GTTextField'
import TooltipWrapper from '../atoms/TooltipWrapper'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { BodySmall } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'

const FEEDBACK_MIN_HEIGHT = 100

const FeedbackTextField = styled(GTTextField)`
    min-height: ${FEEDBACK_MIN_HEIGHT}px;
`

interface FeedbackModalProps {
    isCollapsed?: boolean
}
const FeedbackModal = ({ isCollapsed = false }: FeedbackModalProps) => {
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

    useKeyboardShortcut(
        'sendFeedback',
        useCallback(() => setModalIsOpen(true), [])
    )

    return (
        <>
            {isCollapsed ? (
                <TooltipWrapper dataTip="Share Feedback" tooltipId="navigation-tooltip">
                    <GTIconButton icon={icons.megaphone} onClick={() => setModalIsOpen(true)} />
                </TooltipWrapper>
            ) : (
                <GTButton
                    value="Share feedback"
                    styleType="secondary"
                    size="small"
                    fitContent={false}
                    onClick={() => setModalIsOpen(true)}
                />
            )}
            <GTModal
                open={modalIsOpen}
                setIsModalOpen={setModalIsOpen}
                size="sm"
                tabs={{
                    title: 'Got feedback for us?',
                    body: (
                        <>
                            <BodySmall>
                                Feedback is a gift — thank you. Let us know what things you’d like to see us do more and
                                what things we can do better.
                            </BodySmall>
                            <FeedbackTextField
                                type="plaintext"
                                value={feedback}
                                onChange={(val) => setFeedback(val)}
                                fontSize="small"
                                placeholder="Let us know your thoughts"
                                autoFocus
                            />
                            <GTButton
                                onClick={submitFeedback}
                                value="Send feedback"
                                styleType="primary"
                                size="small"
                                fitContent
                            />
                        </>
                    ),
                }}
            />
        </>
    )
}

export default FeedbackModal
