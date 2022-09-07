import React, { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'

const TITLE_MAX_HEIGHT = 208

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
    initialValue: string
    onEdit: (newValue: string) => void
}
const TitleInput = ({ initialValue, onEdit, ...rest }: TitleInputProps) => {
    const [titleInputValue, setTitleInputValue] = useState(initialValue)
    const titleInputRef = useRef<HTMLTextAreaElement>(null)

    const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (titleInputRef.current && (e.key === 'Enter' || e.key === 'Escape')) titleInputRef.current.blur()
        e.stopPropagation()
    }

    useLayoutEffect(() => {
        if (titleInputRef.current) {
            titleInputRef.current.style.height = '0px'
            titleInputRef.current.style.height =
                titleInputRef.current.scrollHeight > TITLE_MAX_HEIGHT
                    ? `${TITLE_MAX_HEIGHT}px`
                    : `${titleInputRef.current.scrollHeight}px`
        }
    }, [titleInputValue])

    useLayoutEffect(() => {
        setTitleInputValue(initialValue)
    }, [initialValue])

    return (
        <StyledTitleInput
            ref={titleInputRef}
            onKeyDown={handleKeyDown}
            value={titleInputValue}
            onChange={(e) => {
                setTitleInputValue(e.target.value)
                onEdit(e.target.value)
            }}
            {...rest}
        />
    )
}

export default TitleInput
