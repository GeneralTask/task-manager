import { useDeleteTaskSection } from '../../services/api/task-section.hooks'
import { icons } from '../../styles/images'
import { TTaskSection } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import GTContextMenu from './GTContextMenu'
import { GTMenuItem } from './RadixUIConstants'

interface NavigationContextMenuWrapperProps {
    children: React.ReactNode
    section: TTaskSection
    setSectionBeingEdited: (section: TTaskSection) => void
}
const NavigationContextMenuWrapper = ({
    children,
    section,
    setSectionBeingEdited,
}: NavigationContextMenuWrapperProps) => {
    const { mutate: deleteSection } = useDeleteTaskSection()
    const items: GTMenuItem[] = [
        {
            label: 'Rename Section',
            icon: icons.pencil,
            onClick: () => {
                setSectionBeingEdited(section)
            },
        },
        {
            label: 'Delete Section',
            textColor: 'red',
            icon: icons.trash,
            iconColor: 'red',
            onClick: () => {
                console.log({ delete: section })
                deleteSection({ id: section.id }, section.optimisticId)
            },
        },
    ]
    return <GTContextMenu items={items} trigger={children} onOpenChange={emptyFunction} />
}

export default NavigationContextMenuWrapper
