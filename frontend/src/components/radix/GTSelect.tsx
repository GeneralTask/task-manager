import * as Select from '@radix-ui/react-select'
import styled from 'styled-components'
import { Typography } from '../../styles'
import { MenuContentShared, MenuItemShared, MenuTriggerShared } from './RadixUIConstants'

const SelectTrigger = styled(Select.Trigger)`
    ${MenuTriggerShared};
`
const SelectContent = styled(Select.Content)<{
    $menuInModal?: boolean
    $width?: number
    $textColor?: string
    $fontStyle?: 'body' | 'bodySmall' | 'label'
}>`
    ${MenuContentShared};
    z-index: 1000;
    ${({ $menuInModal }) => $menuInModal && `z-index: 1000;`}
    ${({ $width }) => $width && `width: ${$width}px;`}
    ${({ $textColor }) => $textColor && `color: ${$textColor};`}
    ${({ $fontStyle }) => $fontStyle && Typography[$fontStyle]};
    box-sizing: border-box;
`
const SelectItem = styled(Select.Item)`
    ${MenuItemShared};
    width: 100%;
    box-sizing: border-box;
`

interface GTSelectProps {
    items: {
        label: string
        value: string
    }[]
    value?: string
    onChange?: (value: string) => void
}
const GTSelect = ({ items, value, onChange }: GTSelectProps) => {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <SelectTrigger>
                <Select.Value aria-label={value} placeholder="Select a fruit…" />
                down
            </SelectTrigger>
            <SelectContent>
                <Select.ScrollUpButton>up</Select.ScrollUpButton>
                <Select.Viewport>
                    <Select.Group>
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton>down</Select.ScrollDownButton>
            </SelectContent>
        </Select.Root>
    )
}

export default GTSelect
