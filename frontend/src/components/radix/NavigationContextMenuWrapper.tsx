import { useDeleteFolder } from '../../services/api/folders.hooks'
import { icons } from '../../styles/images'
import { TTaskFolder } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface NavigationContextMenuWrapperProps {
    children: React.ReactNode
    folder: TTaskFolder
    setSectionBeingEdited: (folder: TTaskFolder) => void
}
const NavigationContextMenuWrapper = ({
    children,
    folder,
    setSectionBeingEdited,
}: NavigationContextMenuWrapperProps) => {
    const { mutate: deleteFolder } = useDeleteFolder()
    const items: GTMenuItem[] = [
        {
            label: 'Rename Folder',
            icon: icons.pencil,
            onClick: () => {
                setSectionBeingEdited(folder)
            },
        },
        {
            label: 'Delete Folder',
            textColor: 'red',
            icon: icons.trash,
            iconColor: 'red',
            onClick: () => {
                deleteFolder({ id: folder.id }, folder.optimisticId)
            },
        },
    ]
    return <GTContextMenu items={items} trigger={children} onOpenChange={emptyFunction} />
}

export default NavigationContextMenuWrapper
