import { useState } from 'react'
import { TASK_PRIORITIES } from '../../constants'
import { useModifyTask } from '../../services/api/tasks.hooks'
import { TTask } from '../../utils/types'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface PriorityDropdownProps {
    task: TTask
    disabled?: boolean
}
const PriorityDropdown = ({ task, disabled }: PriorityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { mutate: modifyTask } = useModifyTask()

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={TASK_PRIORITIES.map((priority, val) => ({
                label: priority.label,
                onClick: () => modifyTask({ id: task.id, priorityNormalized: val }),
                icon: priority.icon,
                iconColor: TASK_PRIORITIES[val].color,
                selected: val === task.priority_normalized,
            }))}
            trigger={
                <GTButton
                    value={TASK_PRIORITIES[task.priority_normalized].label}
                    icon={TASK_PRIORITIES[task.priority_normalized].icon}
                    size="small"
                    styleType="simple"
                    iconColor={TASK_PRIORITIES[task.priority_normalized].color}
                    onClick={() => setIsOpen(!isOpen)}
                    active={isOpen}
                    disabled={disabled}
                    asDiv
                />
            }
        />
    )
}

export default PriorityDropdown
