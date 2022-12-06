import { useState } from 'react'
import { DateTime } from 'luxon'
import { DEFAULT_SECTION_ID } from '../../constants'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { icons } from '../../styles/images'
import { TNote } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from '../radix/GTDropdownMenu'

interface NoteSharingDropdownProps {
    note: TNote
}
const NoteSharingDropdown = ({ note }: NoteSharingDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { data: taskSections } = useGetTasks(false)

    const isShared = +DateTime.fromISO(note.shared_until) > +DateTime.local()

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            items={
                taskSections
                    ? taskSections
                          .filter((s) => !s.is_done && !s.is_trash)
                          .map((section) => ({
                              label: section.name,
                              icon: section.id === DEFAULT_SECTION_ID ? icons.inbox : icons.folder,
                              // onClick: () => onChange(section.id),
                          }))
                    : []
            }
            unstyledTrigger
            trigger={
                <GTButton
                    size="small"
                    styleType="secondary"
                    icon={icons.share}
                    value="Share"
                    onClick={() => setIsOpen(!isOpen)}
                    asDiv
                />
            }
        />
    )
}

export default NoteSharingDropdown
