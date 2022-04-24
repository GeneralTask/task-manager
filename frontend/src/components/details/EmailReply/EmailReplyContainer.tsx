import EmailReply from './EmailReply'
import { EmailReplyMinHeightContainer } from './EmailReplyStyles'
import React from 'react'
import RoundedGeneralButton from '../../atoms/buttons/RoundedGeneralButton'
import { TEmail } from '../../../utils/types'

interface EmailReplyContainerProps {
    email: TEmail
    sourceAccountId: string
}
const EmailReplyContainer = ({ email, sourceAccountId }: EmailReplyContainerProps) => {
    const [showReplyForm, setShowReplyForm] = React.useState(false)

    return (
        <EmailReplyMinHeightContainer>
            {showReplyForm ? (
                <EmailReply
                    email={email}
                    sourceAccountId={sourceAccountId}
                    discardDraft={() => setShowReplyForm(false)}
                />
            ) : (
                <div>
                    <RoundedGeneralButton
                        value="Reply"
                        textStyle="dark"
                        onPress={() => {
                            setShowReplyForm(true)
                        }}
                    />
                </div>
            )}
        </EmailReplyMinHeightContainer>
    )
}

export default EmailReplyContainer
