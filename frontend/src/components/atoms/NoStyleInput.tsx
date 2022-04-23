import React from 'react'
import styled from 'styled-components'

const StyledInput = styled.input`
    outline-style: none;
    flex-grow: 1;
    border: none;
    background: transparent;
    padding: 0;
`
interface NoStyleInputProps {
    value: string
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    placeholder: string
    onSubmit?: () => void
}
const NoStyleInput = React.forwardRef((props: NoStyleInputProps, ref: React.Ref<HTMLInputElement>) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && props.onSubmit) {
            props.onSubmit()
        } else e.stopPropagation()
    }
    return (
        <StyledInput
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            onKeyDown={handleKeyDown}
            ref={ref}
        />
    )
})

export default NoStyleInput
