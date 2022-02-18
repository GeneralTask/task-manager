import React from 'react'
import styled from 'styled-components'
import { CHEVRON_DOWN } from '../../constants'
import { GRAY_100, GRAY_200, GRAY_800, RED_1, shadow, WHITE } from '../../helpers/styles'

const InputContainer = styled.div<{ valid: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${GRAY_200};
    border-radius: 8px;
    outline: ${(props) => (props.valid ? 'none' : '1px solid ' + { RED_1 })};
`
const Input = styled.input`
    width: 100%;
    background: transparent;
    border: none;
    color: ${GRAY_800};
    font-size: 16px;
    font-weight: 500;
    padding: 6px 0;
    outline: none;
`
const Icon = styled.img`
    width: 16px;
    height: 16px;
    margin: 6px;
`
const Chevron = styled.img`
    width: 8px;
    height: 8px;
    margin: 6px;
    padding: 5px;
    cursor: pointer;
`
const Dropdown = styled.div`
    position: absolute;
    top: 95%;
    left: 5%;
    width: 90%;
    display: flex;
    border-radius: 8px;
    flex-direction: column;
    background: ${WHITE};
    box-shadow: ${shadow.PRIMARY};
    border-radius: 8px;
    height: 200px;
    padding: 6px;
    overflow-y: auto;
`
const Button = styled.button`
    background: transparent;
    text-align: left;
    border: none;
    border-radius: 6px;
    color: ${GRAY_800};
    font-size: 16px;
    font-weight: 500;
    padding: 6px 8px;
    width: 100%;
    cursor: pointer;
    &:hover {
        background-color: ${GRAY_100};
    }
`

interface Props {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    options: { value: number; label: string }[]
    onSubmit?: (val: number) => void
    placeholder?: string
    pattern?: string
    invalidInput?: string
    inputIcon?: string
}

function GTSelect(props: Props): JSX.Element {
    const { onChange, onSubmit, placeholder, inputIcon, options, invalidInput } = props
    const [valid, setValid] = React.useState(true)
    const [expanded, setExpanded] = React.useState(false)

    function optionsList(): JSX.Element[] {
        const { options } = props
        return options.map(({ value, label }, i) => (
            <Button
                key={i}
                value={value}
                onClick={() => {
                    onSubmit && onSubmit(value)
                }}
            >
                {label}
            </Button>
        ))
    }

    function checkValid(val: string): boolean {
        const { pattern } = props
        if (pattern) {
            const regex = new RegExp(pattern)
            setValid(regex.test(val))
            return regex.test(val)
        }
        return true
    }

    function exec(val: string): RegExpExecArray | null {
        const { pattern } = props
        if (pattern) {
            const regex = new RegExp(pattern)
            return regex.exec(val)
        }
        return null
    }

    return (
        <>
            <InputContainer valid={valid}>
                {inputIcon && <Icon src={inputIcon} />}
                <Input
                    onChange={(e) => {
                        checkValid(e.target.value)
                        onChange(e)
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Enter' && checkValid(e.currentTarget.value) && onSubmit) {
                            const result = exec(e.currentTarget.value)
                            if (result) {
                                const val = Number(result[1]) * 60 + Number(result[2])
                                onSubmit(val)
                            }
                        }
                        if (invalidInput) {
                            const regex = new RegExp(invalidInput)
                            if (regex.test(e.key)) e.preventDefault()
                        }
                    }}
                    placeholder={placeholder}
                    autoFocus
                />
                {options && (
                    <Chevron
                        src={CHEVRON_DOWN}
                        onClick={() => {
                            setExpanded(!expanded)
                        }}
                    />
                )}
            </InputContainer>
            {expanded && options && <Dropdown>{optionsList()}</Dropdown>}
        </>
    )
}

export default GTSelect
