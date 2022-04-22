import EmailReply from './EmailReply'
import React from 'react'
import RoundedGeneralButton from '../../atoms/buttons/RoundedGeneralButton'
import { TEmail } from '../../../utils/types'

interface EmailReplyContainerProps {
    email: TEmail
    sourceAccountId: string
}
const EmailReplyContainer = ({ email, sourceAccountId }: EmailReplyContainerProps) => {
    const [showReplyForm, setShowReplyForm] = React.useState(false)

    if (!showReplyForm) {
        return (
            <div>
                <RoundedGeneralButton
                    value="Reply"
                    textStyle="dark"
                    onPress={() => {
                        setShowReplyForm(true)
                    }}
                />
            </div>
        )
    } else {
        return (
            <div>
                <div>
                    reply here{' '}
                    <button
                        onClick={() => {
                            setShowReplyForm(false)
                        }}
                    >
                        stop replying
                    </button>
                </div>
                <EmailReply
                    email={email}
                    sourceAccountId={sourceAccountId}
                    discardDraft={() => setShowReplyForm(false)}
                />
            </div>
        )
    }
}

export default EmailReplyContainer
