import * as Popover from '@radix-ui/react-popover'
import styled from 'styled-components'
import { MenuContentShared } from './RadixUIConstants'

const PopoverTrigger = styled(Popover.Trigger)`
    all: unset;
`
const PopoverContent = styled(Popover.Content)`
    ${MenuContentShared};
    width: unset;
`

interface GTPopoverProps {
    content: React.ReactNode
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    align?: 'start' | 'center' | 'end'
    disabled?: boolean
}
const GTPopover = ({ trigger, content, isOpen, setIsOpen, disabled, align = 'center' }: GTPopoverProps) => {
    return (
        <Popover.Root modal open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger disabled={disabled}>{trigger}</PopoverTrigger>
            <Popover.Portal>
                <PopoverContent align={align}>{content}</PopoverContent>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default GTPopover
