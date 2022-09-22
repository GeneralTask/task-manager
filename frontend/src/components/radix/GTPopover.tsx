import * as Popover from '@radix-ui/react-popover'
import styled from 'styled-components'
import { MenuContentShared } from './RadixUIConstants'

const PopoverTrigger = styled(Popover.Trigger)`
    all: unset;
`
const PopoverContent = styled(Popover.Content)`
    ${MenuContentShared};
`

interface GTPopoverProps {
    content: React.ReactNode
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
}
const GTPopover = ({ trigger, content }: GTPopoverProps) => {
    return (
        <Popover.Root>
            <PopoverTrigger>{trigger}</PopoverTrigger>
            <Popover.Portal>
                <PopoverContent>{content}</PopoverContent>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default GTPopover
