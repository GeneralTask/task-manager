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
}
const GTPopover = ({ trigger, content, isOpen, setIsOpen }: GTPopoverProps) => {
    return (
        <Popover.Root modal open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>{trigger}</PopoverTrigger>
            <Popover.Portal>
                <PopoverContent>{content}</PopoverContent>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default GTPopover
