import { EmailActionButton, EmailActionButtonContainer, FullWidth } from './EmailCompose-styles'

import { EmailComposeType } from '../../../utils/enums'
import { Icon } from '../../atoms/Icon'
import { Images } from '../../../styles'
import React from 'react'
import { TEmailComposeState } from '../../../utils/types'

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
                            emailId,
                        })
                    }}
                >
                    <Icon size="medium" source={Images.icons.reply} />
                </EmailActionButton>
            </EmailActionButtonContainer>
        </FullWidth>
    )
}

export default EmailMainActions
