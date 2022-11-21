import * as Popover from '@radix-ui/react-popover'
import styled from 'styled-components'
import { stopKeydownPropogation } from '../../utils/utils'
import { MenuContentShared, MenuTriggerShared } from './RadixUIConstants'

const PopoverTrigger = styled(Popover.Trigger)`
    ${MenuTriggerShared};
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
    side?: 'top' | 'right' | 'bottom' | 'left'
    unstyledTrigger?: boolean
    modal?: boolean
    disabled?: boolean
}
const GTPopover = ({
    trigger,
    content,
    isOpen,
    setIsOpen,
    disabled,
    align = 'center',
    side,
    unstyledTrigger,
    modal = true,
}: GTPopoverProps) => {
    return (
        <Popover.Root modal={modal} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger disabled={disabled} unstyled={unstyledTrigger}>
                {trigger}
            </PopoverTrigger>
            {content && (
                <Popover.Portal>
                    <PopoverContent
                        onKeyDown={(e) => stopKeydownPropogation(e, ['Escape'], true)}
                        align={align}
                        side={side}
                        sideOffset={side ? 8 : 0}
                    >
                        {content}
                    </PopoverContent>
                </Popover.Portal>
            )}
        </Popover.Root>
    )
}

export default GTPopover
