import * as Select from '@radix-ui/react-select'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TIconImage, icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { MenuContentShared, MenuItemShared, MenuTriggerShared } from './RadixUIConstants'

const SelectTrigger = styled(Select.Trigger)`
    ${MenuTriggerShared};
    ${Typography.bodySmall};
    padding: 8px;
    border: ${Border.stroke.medium} solid ${Colors.border.light};
    box-sizing: border-box;
    user-select: none;
`
const SelectContent = styled(Select.Content)`
    ${MenuContentShared};
    ${Typography.bodySmall};
`
const SelectItem = styled(Select.Item)`
    ${MenuItemShared};
    width: 100%;
    box-sizing: border-box;
    display: flex;
    user-select: none;
`

interface GTSelectProps {
    items: {
        label: string
        value: string
        icon?: TIconImage
    }[]
    value?: string
    onChange?: (value: string) => void
}
const GTSelect = ({ items, value, onChange }: GTSelectProps) => {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <SelectTrigger className="SelectTrigger" aria-label="Food">
                <Select.Value placeholder="Select a fruit…" />
            </SelectTrigger>
            <SelectContent onKeyDown={(e) => stopKeydownPropogation(e, ['Escape'], true)}>
                <Select.ScrollUpButton>up</Select.ScrollUpButton>
                <Select.Viewport>
                    <Select.Group>
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                <Select.ItemText>
                                    <Flex alignItems="center" gap={Spacing._8}>
                                        <Icon icon={icons[item.icon]} /> {item.label}
                                    </Flex>
                                </Select.ItemText>
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
