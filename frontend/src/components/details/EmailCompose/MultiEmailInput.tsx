import { EmailInput, EmailInputContainer, EmailTag } from './EmailCompose-styles'

import { Icon } from '../../atoms/Icon'
import NoStyleButton from '../../atoms/buttons/NoStyleButton'
import React from 'react'
import { TRecipient } from '../../../utils/types'
import { icons } from '../../../styles/images'
import styled from 'styled-components'

const SubjectContainer = styled.div`
    ${EmailInputContainer}
`
const SubjectInput = styled.input`
    ${EmailInput}
`

interface MultiEmailInputProps {
    recipients: TRecipient[]
}
const MultiEmailInput = (props: MultiEmailInputProps) => {
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
            <SubjectInput />
        </SubjectContainer>
    )
}

export default MultiEmailInput
