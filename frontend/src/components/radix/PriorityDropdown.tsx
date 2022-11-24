import { useState } from 'react'
import { TASK_PRIORITIES } from '../../constants'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface PriorityDropdownProps {
    value: number
    onChange: (priority: number) => void
    disabled?: boolean
}
const PriorityDropdown = ({ value, onChange, disabled }: PriorityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={TASK_PRIORITIES.map((priority, index) => ({
                label: priority.label,
                // onClick: () => modifyTask({ id: task.id, priorityNormalized: val }, task.optimisticId),
                onClick: () => onChange(index),
                icon: priority.icon,
                iconColor: TASK_PRIORITIES[index].color,
                selected: index === value,
            }))}
            trigger={
                <GTButton
                    value={TASK_PRIORITIES[value].label}
                    icon={TASK_PRIORITIES[value].icon}
                    size="small"
                    styleType="simple"
                    iconColor={TASK_PRIORITIES[value].color}
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
