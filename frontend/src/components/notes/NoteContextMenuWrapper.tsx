import { useModifyNote } from '../../services/api/notes.hooks'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import GTContextMenu from '../radix/GTContextMenu'
import { GTMenuItem } from '../radix/RadixUIConstants'

interface NoteContextMenuProps {
    note: TNote
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
}
const NoteContextMenuWrapper = ({ note, children, onOpenChange }: NoteContextMenuProps) => {
    const { mutate: modifyNote } = useModifyNote()

    const contextMenuItems: GTMenuItem[] = [
        {
            label: note.is_deleted ? 'Restore Note' : 'Delete Note',
            icon: icons.trash,
            iconColor: 'red',
            textColor: 'red',
            onClick: () => modifyNote({ id: note.id, is_deleted: !note.is_deleted }, note.optimisticId),
        },
    ]
    return <GTContextMenu items={contextMenuItems} trigger={children} onOpenChange={onOpenChange} />
}

export default NoteContextMenuWrapper
