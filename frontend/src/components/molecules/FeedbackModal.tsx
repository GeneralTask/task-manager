import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useKeyboardShortcut, usePreviewMode, useToast } from '../../hooks'
import { usePostFeedback } from '../../services/api/feedback.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'
import { DeprecatedBodySmall } from '../atoms/typography/Typography'
import GTModal from '../mantine/GTModal'
import { CollapsedIconContainer } from '../navigation_sidebar/NavigationLink'
import Tip from '../radix/Tip'
import { toast } from './toast/utils'

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
    const oldToast = useToast()
    const { isPreviewMode } = usePreviewMode()
    const submitFeedback = () => {
        if (feedback.trim().length === 0) return
        postFeedback({ feedback: feedback })
        setFeedback('')
        setModalIsOpen(false)
        if (isPreviewMode) {
            toast('Thank you for your feedback')
        } else {
            oldToast.show(
                {
                    message: 'Thank you for your feedback',
                },
                {
                    autoClose: 2000,
                    theme: 'dark',
                }
            )
        }
    }

    useKeyboardShortcut(
        'sendFeedback',
        useCallback(() => setModalIsOpen(true), [])
    )

    return (
        <>
            {isCollapsed ? (
                <Tip content="Share Feedback" side="right">
                    <CollapsedIconContainer onClick={() => setModalIsOpen(true)}>
                        <Icon icon={icons.megaphone} />
                    </CollapsedIconContainer>
                </Tip>
            ) : (
                <GTButton
                    value="Share feedback"
                    styleType="secondary"
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
                        <Flex column gap={Spacing._16}>
                            <DeprecatedBodySmall>
                                Feedback is a gift — thank you. Let us know what things you’d like to see us do more and
                                what things we can do better.
                            </DeprecatedBodySmall>
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
                                disabled={feedback.trim().length === 0}
                                value="Send feedback"
                                styleType="primary"
                            />
                        </Flex>
                    ),
                }}
            />
        </>
    )
}

export default FeedbackModal
