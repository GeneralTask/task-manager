import { useRef } from 'react'
import * as Select from '@radix-ui/react-select'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TIconImage, icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { Truncated } from '../atoms/typography/Typography'
import { MenuContentShared, MenuItemShared, MenuTriggerShared } from './RadixUIConstants'

const DEFAULT_MAX_WIDTH = '400px'

const SelectTrigger = styled(Select.Trigger)`
    ${MenuTriggerShared};
    ${Typography.bodySmall};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${Spacing._4} ${Spacing._8};
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    box-sizing: border-box;
    user-select: none;
    cursor: pointer;
`
const SelectContent = styled(Select.Content)<{ $useTriggerWidth?: boolean }>`
    ${MenuContentShared};
    ${Typography.bodySmall};
    ${({ $useTriggerWidth }) => ($useTriggerWidth ? `width: 100%;` : `max-width: ${DEFAULT_MAX_WIDTH};`)};
`
const SelectItem = styled(Select.Item)`
    ${MenuItemShared};
    width: 100%;
    box-sizing: border-box;
    display: block;
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
`
const SelectItemTextContent = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    width: 100%;
    overflow: hidden;
`
const DownCaret = styled(Icon)`
    margin-left: ${Spacing._4};
`

interface GTSelectProps {
    items: {
        label: string
        value: string
        icon?: TIconImage
    }[]
    value?: string
    placeholder?: string
    useTriggerWidth?: boolean
    onChange?: (value: string) => void
}
const GTSelect = ({ items, value, placeholder, useTriggerWidth, onChange }: GTSelectProps) => {
    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <SelectTrigger ref={triggerRef}>
                <Truncated>
                    <Select.Value placeholder={placeholder ?? 'Select an item'} />
                </Truncated>
                <DownCaret icon={icons.caret_down_solid} color="gray" />
            </SelectTrigger>
            <Select.Portal>
                <SelectContent
                    onKeyDown={(e) => stopKeydownPropogation(e, ['Escape'], true)}
                    $useTriggerWidth={useTriggerWidth}
                >
                    <Select.ScrollUpButton>
                        <Flex justifyContent="center">
                            <Icon icon={icons.caret_up} />
                        </Flex>
                    </Select.ScrollUpButton>
                    <Select.Viewport>
                        <Select.Group>
                            {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    <Select.ItemText>
                                        <SelectItemTextContent>
                                            {item.icon && <Icon icon={icons[item.icon]} />}
                                            {item.label}
                                        </SelectItemTextContent>
                                    </Select.ItemText>
                                </SelectItem>
                            ))}
                        </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton>
                        <Flex justifyContent="center">
                            <Icon icon={icons.caret_down} />
                        </Flex>
                    </Select.ScrollDownButton>
                </SelectContent>
            </Select.Portal>
        </Select.Root>
    )
}

export default GTSelect
