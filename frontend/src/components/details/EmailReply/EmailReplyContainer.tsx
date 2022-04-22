import EmailReply from './EmailReply'
import React from 'react'
import RoundedGeneralButton from '../../atoms/buttons/RoundedGeneralButton'

const EmailReplyContainer = () => {
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
                <EmailReply />
            </div>
        )
    }
}

export default EmailReplyContainer
