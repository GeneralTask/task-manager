import { useState } from 'react'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { TExternalPriority } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTIconButton from '../atoms/buttons/GTIconButton'
import GTDropdownMenu from './GTDropdownMenu'
import { GTMenuItem } from './RadixUIConstants'

interface JiraPriorityDropdownProps {
    taskId: string
    currentPriority: TExternalPriority
    allPriorities: TExternalPriority[]
    disabled?: boolean
    condensedTrigger?: boolean
}

const JiraPriorityDropdown = ({
    taskId,
    currentPriority,
    allPriorities,
    disabled,
    condensedTrigger,
}: JiraPriorityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    const items: GTMenuItem[] = allPriorities.map((priority) => ({
        label: `${priority.name} priority`,
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
            unstyledTrigger
            trigger={
                condensedTrigger ? (
                    <GTIconButton
                        icon={currentPriority.icon_url}
                        tooltipText={`${currentPriority.name} priority`}
                        forceShowHoverEffect={isOpen}
                        asDiv
                    />
                ) : (
                    <GTButton
                        value={`${currentPriority.name} priority`}
                        icon={currentPriority.icon_url}
                        size="small"
                        styleType="simple"
                        onClick={() => setIsOpen(!isOpen)}
                        active={isOpen}
                        disabled={disabled}
                        asDiv
                    />
                )
            }
        />
    )
}

export default JiraPriorityDropdown
