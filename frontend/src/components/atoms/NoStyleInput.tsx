import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledInput = styled.input`
    outline-style: none;
    flex-grow: 1;
    border: none;
    background: transparent;
    padding: 0;
`

const NoStyleInput = forwardRef(
    (props: React.InputHTMLAttributes<HTMLInputElement>, ref: React.Ref<HTMLInputElement>) => (
        <StyledInput {...props} ref={ref} />
    )
)

export default NoStyleInput
