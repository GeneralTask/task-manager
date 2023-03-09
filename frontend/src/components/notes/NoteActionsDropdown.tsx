import { useState } from 'react'
import { DateTime } from 'luxon'
import { useModifyNote } from '../../services/api/notes.hooks'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import Flex from '../atoms/Flex'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Mini } from '../atoms/typography/Typography'
import GTDropdownMenu from '../radix/GTDropdownMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

interface NoteActionsDropdownProps {
    note: TNote
    isOwner?: boolean
}
const NoteActionsDropdown = ({ note, isOwner = true }: NoteActionsDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyNote } = useModifyNote()

    const updatedAt = DateTime.fromISO(note.updated_at).toFormat(`MMM d 'at' h:mm a`)
    const createdAt = DateTime.fromISO(note.created_at).toFormat(`MMM d 'at' h:mm a`)

    const ownerItems: GTMenuItem[] = [
        {
            label: note.is_deleted ? 'Restore Note' : 'Delete Note',
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
            onClick: () => modifyNote({ id: note.id, is_deleted: !note.is_deleted }, note.optimisticId),
        },
    ]

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            hideCheckmark
            items={[
                ...(isOwner ? [ownerItems] : []),
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
            trigger={
                <GTIconButton
                    icon={icons.ellipsisVertical}
                    tooltipText="Note Actions"
                    onClick={() => setIsOpen(!isOpen)}
                    forceShowHoverEffect={isOpen}
                />
            }
        />
    )
}

export default NoteActionsDropdown
