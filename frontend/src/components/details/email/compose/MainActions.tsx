import { EmailActionButton, EmailActionButtonContainer, Flex } from './styles'
import { TEmail, TEmailComposeState } from '../../../../utils/types'

import { EmailComposeType } from '../../../../utils/enums'
import { Icon } from '../../../atoms/Icon'
import { Images } from '../../../../styles'
import React from 'react'

interface EmailMainActionsProps {
    email: TEmail
    setThreadComposeState: (state: TEmailComposeState) => void
}
const EmailMainActions = ({ email, setThreadComposeState }: EmailMainActionsProps) => {
    const numRecipients = email.recipients.to.length + email.recipients.cc.length
    return (
        <Flex>
            <EmailActionButtonContainer>
                <EmailActionButton
                    onClick={() => {
                        setThreadComposeState({
                            emailComposeType: EmailComposeType.REPLY,
                            emailId: email.message_id,
                        })
                    }}
                >
                    <Icon size="medium" source={Images.icons.reply} />
                </EmailActionButton>
            </EmailActionButtonContainer>
            {numRecipients > 1 && (
                <EmailActionButtonContainer>
                    <EmailActionButton
                        onClick={() => {
                            setThreadComposeState({
                                emailComposeType: EmailComposeType.REPLY_ALL,
                                emailId: email.message_id,
                            })
                        }}
                    >
                        <Icon size="medium" source={Images.icons.replyAll} />
                    </EmailActionButton>
                </EmailActionButtonContainer>
            )}
            <EmailActionButtonContainer>
                <EmailActionButton
                    onClick={() => {
                        setThreadComposeState({
                            emailComposeType: EmailComposeType.FORWARD,
                            emailId: email.message_id,
                        })
                    }}
                >
                    <Icon size="medium" source={Images.icons.forward} />
                </EmailActionButton>
            </EmailActionButtonContainer>
        </Flex>
    )
}

export default EmailMainActions
