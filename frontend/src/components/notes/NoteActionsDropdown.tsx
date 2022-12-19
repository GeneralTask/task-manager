import { useState } from 'react'
import { DateTime } from 'luxon'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Mini } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface NoteActionsDropdownProps {
    note: TNote
}
const NoteActionsDropdown = ({ note }: NoteActionsDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const updatedAt = DateTime.fromISO(note.updated_at).toFormat(`MMM d 'at' h:mm a`)
    const createdAt = DateTime.fromISO(note.created_at).toFormat(`MMM d 'at' h:mm a`)

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            hideCheckmark
            items={[
                [
                    {
                        label: 'Info',
                        disabled: true,
                        renderer: () => (
                            <Flex column>
                                <Mini color="light">{`Last updated ${updatedAt}`}</Mini>
                                <Mini color="light">{`Created ${createdAt}`}</Mini>
                            </Flex>
                        ),
                    },
                ],
            ]}
            unstyledTrigger
            trigger={
                <GTIconButton
                    icon={icons.ellipsisVertical}
                    onClick={() => setIsOpen(!isOpen)}
                    forceShowHoverEffect={isOpen}
                    asDiv
                />
            }
        />
    )
}

export default NoteActionsDropdown
