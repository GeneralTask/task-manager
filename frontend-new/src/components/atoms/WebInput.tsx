import React from 'react'
import styled from 'styled-components'


const StyledInput = styled.input`
    outline-style: none;
    flex-grow: 1;
    border: none;
    background: transparent;
`
interface WebInputProps {
    value: string
    onChange?: ((event: React.ChangeEvent<HTMLInputElement>) => void)
    placeholder: string
    onSubmit?: () => any
}
const WebInput = React.forwardRef((props: WebInputProps, ref: React.Ref<HTMLInputElement>) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.key === 'Enter' && props.onSubmit) {
            props.onSubmit()
        }
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

export default WebInput
