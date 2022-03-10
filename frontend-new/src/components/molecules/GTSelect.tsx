import React from 'react'
import { ImageSourcePropType, Pressable, View } from 'react-native'
import styled from 'styled-components'
import { Colors } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'

const InputContainer = styled.div<{ valid: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${Colors.gray._200};
    border-radius: 8px;
    outline: ${(props) => (props.valid ? 'none' : `1px solid ${Colors.red._1}`)};
    margin-bottom: 4px;
`
const Input = styled.input`
    width: 100%;
    background: transparent;
    border: none;
    color: ${Colors.gray._800};
    font-size: 16px;
    font-weight: 500;
    padding: 6px 0;
    outline: none;
`
// const Icon = styled.img`
//     width: 16px;
//     height: 16px;
//     margin: 6px;
// `
// const Chevron = styled.img`
//     width: 8px;
//     height: 8px;
//     margin: 6px;
//     padding: 5px;
//     cursor: pointer;
// `
const Dropdown = styled.div`
    /* position: absolute; */
    /* top: 95%;
    left: 5%;
    width: 90%; */
    display: flex;
    border-radius: 8px;
    flex-direction: column;
    background: ${Colors.white};
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
    color: ${Colors.gray._800};
    font-size: 16px;
    font-weight: 500;
    padding: 6px 8px;
    width: 100%;
    cursor: pointer;
    &:hover {
        background-color: ${Colors.gray._100};
    }
`

interface Props {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    options: { value: number; label: string }[]
    onSubmit?: (val: number) => void
    placeholder?: string
    pattern?: string
    invalidInput?: string
    inputIcon?: NodeRequire | ImageSourcePropType
}

function GTSelect(props: Props): JSX.Element {
    const { onChange, onSubmit, placeholder, inputIcon, options, invalidInput } = props
    const [valid, setValid] = React.useState(true)
    const [expanded, setExpanded] = React.useState(true)

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
                {inputIcon && <View style={{ margin: 6 }}><Icon source={inputIcon} size="xSmall" /></View>}
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
                    <Pressable onPress={() => setExpanded(!expanded)} style={{ margin: 6, padding: 5 }}>
                        <Icon source={icons['chevron_down']} size="xSmall" />
                    </Pressable>
                )}
            </InputContainer>
            {expanded && options && <Dropdown>{optionsList()}</Dropdown>}
        </>
    )
}

export default GTSelect
