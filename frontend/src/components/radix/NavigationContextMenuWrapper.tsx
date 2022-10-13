import { useDeleteTaskSection } from '../../services/api/task-section.hooks'
import { icons } from '../../styles/images'
import { emptyFunction } from '../../utils/utils'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface NavigationContextMenuWrapperProps {
    children: React.ReactNode
    sectionId: string
    setSectionName: () => void
    setSectionBeingEdited: (sectionId: string) => void
}
const NavigationContextMenuWrapper = ({
    children,
    sectionId,
    setSectionName,
    setSectionBeingEdited,
}: NavigationContextMenuWrapperProps) => {
    const { mutate: deleteSection } = useDeleteTaskSection()
    const items: GTMenuItem[] = [
        {
            label: 'Delete Section',
            textColor: 'red',
            icon: icons.trash,
            iconColor: 'red',
            onClick: () => {
                deleteSection({ sectionId: sectionId })
            },
        },
        {
            label: 'Rename Section',
            icon: icons.pencil,
            onClick: () => {
                setSectionName()
                setSectionBeingEdited(sectionId)
            },
        },
    ]
    return <GTContextMenu items={items} trigger={children} onOpenChange={emptyFunction} />
}

export default NavigationContextMenuWrapper
