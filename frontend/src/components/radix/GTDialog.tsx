import * as Dialog from '@radix-ui/react-dialog'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import Flex from '../atoms/Flex'
import GTButton from '../atoms/buttons/GTButton'
import { MenuContentShared } from './RadixUIConstants'

const OVERLAY_COLOR = 'rgba(255, 255, 255, 0.55)'
const MAX_WIDTH = '289px'

const DialogOverlay = styled(Dialog.Overlay)`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: ${OVERLAY_COLOR};
    backdrop-filter: blur(3px);
    z-index: 1001;
`

const DialogContent = styled(Dialog.Content)`
    ${MenuContentShared};
    border-radius: ${Border.radius.medium};
    max-width: ${MAX_WIDTH};
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: ${Spacing._24};
    z-index: 1002;
`
const DialogTitle = styled(Dialog.Title)`
    all: unset;
    color: ${Colors.text.title};
    ${Typography.title.large};
`
const DialogDescription = styled(Dialog.Description)`
    all: unset;
    color: ${Colors.text.base};
    ${Typography.body.medium};
`

interface GTDialogProps {
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    isOpen?: boolean
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    disabled?: boolean
    // content props
    title?: string
    description?: string
    actions?: React.ReactNode
    hideCancelButton?: boolean
}
const GTDialog = ({
    trigger,
    isOpen,
    setIsOpen,
    disabled,
    title,
    description,
    actions,
    hideCancelButton,
}: GTDialogProps) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger disabled={disabled} asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Portal>
                <DialogOverlay />
                <DialogContent>
                    <Flex gap={Spacing._16} column>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description && <DialogDescription>{description}</DialogDescription>}
                        <Flex gap={Spacing._8}>
                            {actions}
                            {!hideCancelButton && (
                                <Dialog.Close asChild>
                                    <GTButton styleType="secondary" value="Cancel" />
                                </Dialog.Close>
                            )}
                        </Flex>
                    </Flex>
                </DialogContent>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default GTDialog
