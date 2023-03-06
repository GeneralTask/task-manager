import { useState } from 'react'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { TExternalPriority } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'
import { GTMenuItem } from './RadixUIConstants'

interface JiraPriorityDropdownProps {
    taskId: string
    currentPriority: TExternalPriority
    allPriorities: TExternalPriority[]
    disabled?: boolean
}

const JiraPriorityDropdown = ({ taskId, currentPriority, allPriorities, disabled }: JiraPriorityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const items: GTMenuItem[] = allPriorities.map((priority) => ({
        label: priority.name,
        onClick: () => {
            modifyTask({
                id: taskId,
                external_priority_id: priority.external_id,
                priorityNormalized: priority.priority_normalized,
            })
        },
        icon: priority.icon_url,
        selected: currentPriority.external_id === priority.external_id,
    }))

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={items}
            trigger={
                <GTButton
                    value={currentPriority.name}
                    icon={currentPriority.icon_url}
                    size="small"
                    styleType="simple"
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    disabled={disabled}
                    asDiv
                />
            }
        />
    )
}

export default JiraPriorityDropdown
