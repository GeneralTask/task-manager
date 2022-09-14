import { useState } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

const InputContainer = styled.div<{ valid: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border: ${Border.stroke.large} solid ${Colors.background.dark};
    border-radius: 8px;
    outline: ${(props) => (props.valid ? 'none' : `1px solid ${Colors.status.red.default}`)};
    margin-bottom: 4px;
`
const Input = styled.input`
    width: 100%;
    background: transparent;
    border: none;
    color: ${Colors.text.light};
    font-size: 16px;
    font-weight: 500;
    padding: 6px 0;
    outline: none;
`
const Dropdown = styled.div`
    display: flex;
    border-radius: 8px;
    flex-direction: column;
    background-color: ${Colors.background.white};
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
    color: ${Colors.text.light};
    font-size: 16px;
    font-weight: 500;
    padding: 6px 8px;
    width: 100%;
    cursor: pointer;
    &:hover {
        background-color: ${Colors.background.medium};
    }
`
const ExpandButton = styled(NoStyleButton)`
    padding: ${Spacing._8};
`
const IconContainer = styled.div`
    margin: ${Spacing._8};
`

interface Props {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    options: { value: number; label: string }[]
    onSubmit?: (val: number) => void
    placeholder?: string
    pattern?: string
    invalidInput?: string
    inputIcon?: IconProp
}

function GTInputSelect(props: Props): JSX.Element {
    const { onChange, onSubmit, placeholder, inputIcon, options, invalidInput } = props
    const [valid, setValid] = useState(true)
    const [expanded, setExpanded] = useState(true)

    function optionsList(): JSX.Element[] {
        const { options } = props
        return options.map(({ value, label }) => (
            <Button
                key={value}
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
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
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
    }

    return (
        <>
            <InputContainer valid={valid}>
                {inputIcon && (
                    <IconContainer>
                        <Icon icon={inputIcon} size="xSmall" />
                    </IconContainer>
                )}
                <Input
                    onChange={(e) => {
                        checkValid(e.target.value)
                        onChange(e)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus
                />
                {options.length && (
                    <ExpandButton onClick={() => setExpanded(!expanded)}>
                        <Icon icon={icons.caret_down} size="xSmall" />
                    </ExpandButton>
                )}
            </InputContainer>
            {expanded && options && <Dropdown>{optionsList()}</Dropdown>}
        </>
    )
}

export default GTInputSelect
