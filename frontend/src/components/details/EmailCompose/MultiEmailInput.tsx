import { EmailInput, EmailInputContainer, EmailTag } from './EmailCompose-styles'
import React, { useCallback } from 'react'

import { Icon } from '../../atoms/Icon'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import { TRecipient } from '../../../utils/types'
import { icons } from '../../../styles/images'
import { isValidEmail } from '../../../utils/utils'
import styled from 'styled-components'

const SubjectContainer = styled.div`
    ${EmailInputContainer}
`
const SubjectInput = styled.input`
    ${EmailInput}
`

const ADD_RECIPIENT_KEYBOARD_SHORTCUTS = ['Enter', 'Tab', 'Space', ',', ';']
const DELETE_RECIPIENT_KEYBOARD_SHORTCUTS = 'Backspace'

interface MultiEmailInputProps {
    recipients: TRecipient[]
    updateRecipients: (recipients: TRecipient[]) => void
}
const MultiEmailInput = (props: MultiEmailInputProps) => {
    const [text, setText] = React.useState('')

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setText(e.target.value)
        },
        [text]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            e.stopPropagation()
            // keyboard shortcuts
            if (ADD_RECIPIENT_KEYBOARD_SHORTCUTS.includes(e.key)) {
                addRecipientIfValid()
            } else if (DELETE_RECIPIENT_KEYBOARD_SHORTCUTS === e.key) {
                // delete
            }
        },
        [text]
    )

    const addRecipientIfValid = () => {
        const trimmedText = text.trim()
        console.log({ trimmedText })
        if (trimmedText.length < 0) return
        if (isValidEmail(trimmedText) && !props.recipients.some((r) => r.email === trimmedText)) {
            const newRecipient = {
                name: '',
                email: trimmedText,
            }
            props.updateRecipients([...props.recipients, newRecipient])
            setText('')
        } else {
            if (!isValidEmail(trimmedText)) {
                alert('is not valid :(')
            } else {
                alert('already exists')
            }
        }
    }

    return (
        <SubjectContainer>
            {props.recipients.map(({ email }, index) => (
                <EmailTag key={email}>
                    {email}
                    <NoStyleButton
                        data-tag-handle
                        onClick={() => {
                            console.log('remove ' + index)
                        }}
                    >
                        <Icon size="xSmall" source={icons.x} />
                    </NoStyleButton>
                </EmailTag>
            ))}
            <SubjectInput className="email-header" value={text} onChange={handleChange} onKeyDown={handleKeyDown} />
        </SubjectContainer>
    )
}

export default MultiEmailInput
