import { EmailActionButton, EmailActionButtonContainer, FullWidth } from './EmailCompose-styles'
import React from 'react'
import { TEmailComposeState } from '../../../utils/types'
import { Icon } from '../../atoms/Icon'
import { Images } from '../../../styles'
import { EmailComposeType } from '../../../utils/enums'

interface EmailMainActionsProps {
    emailId: string
    setThreadComposeState: (state: TEmailComposeState) => void
}
const EmailMainActions = ({ emailId, setThreadComposeState }: EmailMainActionsProps) => {
    return (
        <FullWidth>
            <EmailActionButtonContainer>
                <EmailActionButton
                    onClick={() => {
                        setThreadComposeState({
                            emailComposeType: EmailComposeType.REPLY,
                            showComposeForEmailId: emailId,
                        })
                    }}
                >
                    <Icon size="medium" source={Images.icons.reply} />
                </EmailActionButton>
            </EmailActionButtonContainer>
            {/* coming soon */}
            {/* <EmailActionButtonContainer>
                <EmailActionButton
                    onClick={() => {
                        setThreadComposeState({
                            emailComposeType: EmailComposeType.REPLY_ALL,
                            showComposeForEmailId: emailId,
                        })
                    }}
                >
                    <Icon size="medium" source={Images.icons.replyAll} />
                </EmailActionButton>
            </EmailActionButtonContainer>
            <EmailActionButtonContainer>
                <EmailActionButton
                    onClick={() => {
                        setThreadComposeState({
                            emailComposeType: EmailComposeType.FORWARD,
                            showComposeForEmailId: emailId,
                        })
                    }}
                >
                    <Icon size="medium" source={Images.icons.forward} />
                </EmailActionButton>
            </EmailActionButtonContainer> */}
        </FullWidth>
    )
}

export default EmailMainActions
