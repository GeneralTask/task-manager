import EmailReply from './EmailCompose'
import {
    EmailActionButton,
    EmailActionButtonContainer,
    EmailReplyMinHeightContainer,
    FullWidth,
} from './EmailCompose-styles'
import React from 'react'
import { TEmail } from '../../../utils/types'
import { Icon } from '../../atoms/Icon'
import { Images } from '../../../styles'

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
                <FullWidth>
                    <EmailActionButtonContainer>
                        <EmailActionButton
                            onClick={() => {
                                setShowReplyForm(true)
                            }}
                        >
                            <Icon size="medium" source={Images.icons.reply} />
                        </EmailActionButton>
                    </EmailActionButtonContainer>
                    <EmailActionButtonContainer>
                        <EmailActionButton
                            onClick={() => {
                                setShowReplyForm(true)
                            }}
                        >
                            <Icon size="medium" source={Images.icons.replyAll} />
                        </EmailActionButton>
                    </EmailActionButtonContainer>
                    <EmailActionButtonContainer>
                        <EmailActionButton
                            onClick={() => {
                                setShowReplyForm(true)
                            }}
                        >
                            <Icon size="medium" source={Images.icons.forward} />
                        </EmailActionButton>
                    </EmailActionButtonContainer>
                </FullWidth>
            )}
        </EmailReplyMinHeightContainer>
    )
}

export default EmailReplyContainer
