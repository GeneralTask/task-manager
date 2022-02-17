import React from 'react'
import styled from 'styled-components'
import { GRAY_400, GRAY_800 } from '../../helpers/styles'

const Input = styled.input`
    background: transparent;
    border: none;
    border-bottom: 1px solid ${GRAY_400};
    color: ${GRAY_800};
    font-size: 16px;
    font-weight: 500;
    padding: 4px 6px 4px 6px;
    width: 100%;
    outline: none;
    cursor: pointer;
    &:focus {
        border-bottom: 1px solid ${GRAY_800};
    }
`

const Button = styled.button`
    background: transparent;
    border: none;
    border-radius: 6px;
    color: ${GRAY_800};
    font-size: 16px;
    font-weight: 500;
    padding: 4px 6px 4px 6px;
    margin: 4px;
    cursor: pointer;
    &:hover {
        color: ${GRAY_800};
    }
`

interface Props {
    value: string
    onChange: (value: string) => void
    options: { value: number; label: string }[]
    placeholder?: string
}

function GTSelect(props: Props): JSX.Element {
    return (
        <>
            <Input
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
            />
            {props.options.map(({ value, label }, i) => (
                <Button key={i} value={value}>
                    {label}
                </Button>
            ))}
        </>
    )
}

export default GTSelect
