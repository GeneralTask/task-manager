import {
    AddEmailRecipientsButton,
    AddEmailRecipientsContainer,
    EmailRecipientsContainer,
    FlexExpand,
} from './EmailCompose-styles'
import React, { useCallback, useState } from 'react'
import { TRecipient, TRecipients } from '../../../utils/types'

import { Colors } from '../../../styles'
import { Divider } from '../../atoms/SectionDivider'
import MultiEmailInput from './MultiEmailInput'

interface EmailRecipientsInputProps {
    recipients: TRecipients
    setRecipients: React.Dispatch<React.SetStateAction<TRecipients>>
}

const EmailRecipientsInput = ({ recipients, setRecipients }: EmailRecipientsInputProps) => {
    const [showCc, setShowCc] = useState(recipients.cc.length > 0)
    const [showBcc, setShowBcc] = useState(recipients.bcc.length > 0)

    const onToChange = useCallback(
        (newEmails: TRecipient[]) => setRecipients((recipients) => ({ ...recipients, to: newEmails })),
        []
    )
    const onCcChange = useCallback(
        (newEmails: TRecipient[]) => setRecipients((recipients) => ({ ...recipients, cc: newEmails })),
        []
    )
    const onBccChange = useCallback(
        (newEmails: TRecipient[]) => setRecipients((recipients) => ({ ...recipients, bcc: newEmails })),
        []
    )

    return (
        <EmailRecipientsContainer>
            <FlexExpand>
                <MultiEmailInput recipients={recipients.to} title="To:" updateRecipients={onToChange} />
            </FlexExpand>
            {(!showCc || !showBcc) && (
                <AddEmailRecipientsContainer>
                    {!showCc && <AddEmailRecipientsButton onClick={() => setShowCc(true)}>Cc</AddEmailRecipientsButton>}
                    {!showBcc && (
                        <AddEmailRecipientsButton onClick={() => setShowBcc(true)}>Bcc</AddEmailRecipientsButton>
                    )}
                </AddEmailRecipientsContainer>
            )}
            <Divider color={Colors.gray._200} />

            {showCc && (
                <>
                    <FlexExpand>
                        <MultiEmailInput recipients={recipients.cc} title="Cc:" updateRecipients={onCcChange} />
                    </FlexExpand>
                    <Divider color={Colors.gray._200} />
                </>
            )}
            {showBcc && (
                <>
                    <FlexExpand>
                        <MultiEmailInput recipients={recipients.bcc} title="Bcc:" updateRecipients={onBccChange} />
                    </FlexExpand>
                    <Divider color={Colors.gray._200} />
                </>
            )}
        </EmailRecipientsContainer>
    )
}

export default EmailRecipientsInput
