import React, { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'

const TITLE_MAX_HEIGHT = '208px'

const StyledTitleInput = styled.textarea`
    background-color: inherit;
    color: ${Colors.text.light};
    font: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    margin-bottom: ${Spacing.margin._16};
    :focus {
        outline: 1px solid ${Colors.background.dark};
    }
    ${Typography.subtitle};
`

interface TitleInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string
    setValue: React.Dispatch<React.SetStateAction<string>>
    onEdit: (newValue: string) => void
}
const TitleInput = ({ value, setValue, onEdit, ...rest }: TitleInputProps) => {
    const titleInputRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleInputRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleInputRef.current.blur()
        e.stopPropagation()
    }

    useLayoutEffect(() => {
        if (titleInputRef.current) {
            titleInputRef.current.style.height = '0px'
            titleInputRef.current.style.height =
                titleInputRef.current.scrollHeight > 300 ? TITLE_MAX_HEIGHT : `${titleInputRef.current.scrollHeight}px`
        }
    }, [value])

    return (
        <StyledTitleInput
            ref={titleInputRef}
            onKeyDown={handleKeyDown}
            value={value}
            onChange={(e) => {
                setValue(e.target.value)
                onEdit(e.target.value)
            }}
            {...rest}
        />
    )
}

export default TitleInput
