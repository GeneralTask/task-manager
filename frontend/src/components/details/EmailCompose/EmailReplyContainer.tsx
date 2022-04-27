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
const EmailReplyContainer = (props: EmailReplyContainerProps) => {
    console.log(props)
    const setShowReplyForm = (b: boolean) => !b
    return (
        <EmailReplyMinHeightContainer>
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
        </EmailReplyMinHeightContainer>
    )
}

export default EmailReplyContainer
