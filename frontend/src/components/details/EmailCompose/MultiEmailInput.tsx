import { EmailFieldContainer, EmailFieldInput, EmailTag } from './EmailCompose-styles'
import React, { forwardRef, useCallback, useState } from 'react'

import { Icon } from '../../atoms/Icon'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import { TRecipient } from '../../../utils/types'
import { icons } from '../../../styles/images'
import { isValidEmail } from '../../../utils/utils'

const ADD_RECIPIENT_KEYBOARD_SHORTCUTS = ['Enter', 'Tab', ' ', ',']
const DELETE_RECIPIENT_KEYBOARD_SHORTCUTS = 'Backspace'

interface MultiEmailInputProps {
    recipients: TRecipient[]
    title?: string
    updateRecipients: (recipients: TRecipient[]) => void
}
const MultiEmailInput = forwardRef<HTMLInputElement, MultiEmailInputProps>(
    ({ recipients, title, updateRecipients }, ref) => {
        const [text, setText] = useState('')
        const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            setText(e.target.value)
        }, [])

        const addRecipientIfValid = useCallback(
            (emailText: string) => {
                emailText = emailText.trim()
                console.log({ emailText })
                if (emailText.length < 0) return
                if (isValidEmail(emailText) && !recipients.some((r) => r.email === emailText)) {
                    const newRecipient = {
                        name: '',
                        email: emailText,
                    }
                    updateRecipients([...recipients, newRecipient])
                    setText('')
                }
            },
            [recipients, updateRecipients]
        )

        const deleteRecipient = useCallback(
            (email: string) => {
                updateRecipients(recipients.filter((r) => r.email !== email))
            },
            [recipients, updateRecipients]
        )

        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent<HTMLInputElement>, emailText: string) => {
                if (ADD_RECIPIENT_KEYBOARD_SHORTCUTS.includes(e.key)) {
                    e.preventDefault()
                    addRecipientIfValid(emailText)
                } else if (DELETE_RECIPIENT_KEYBOARD_SHORTCUTS === e.key) {
                    if (emailText.trim().length === 0) {
                        e.preventDefault()
                        deleteRecipient(recipients[recipients.length - 1].email)
                    }
                }
                e.stopPropagation()
            },
            [addRecipientIfValid, deleteRecipient]
        )

        return (
            <EmailFieldContainer>
                <span>{title}</span>
                {recipients.map(({ email }) => (
                    <EmailTag key={email}>
                        {email}
                        <NoStyleButton
                            data-tag-handle
                            onClick={() => {
                                deleteRecipient(email)
                            }}
                        >
                            <Icon size="xSmall" source={icons.x} />
                        </NoStyleButton>
                    </EmailTag>
                ))}
                <EmailFieldInput
                    ref={ref}
                    value={text}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, text)}
                    onBlur={() => {
                        addRecipientIfValid(text)
                    }}
                />
            </EmailFieldContainer>
        )
    }
)

export default MultiEmailInput
