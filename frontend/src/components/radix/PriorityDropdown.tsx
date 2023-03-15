import { useState } from 'react'
import { TASK_PRIORITIES } from '../../constants'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'
import PriorityDropdownTrigger from './PriorityDropdownTrigger'

interface PriorityDropdownProps {
    value: number
    onChange: (priority: number) => void
    disabled?: boolean
    condensedTrigger?: boolean
    overrideDisabledStyle?: boolean
}
const PriorityDropdown = ({ value, onChange, disabled, condensedTrigger }: PriorityDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)

    if (!Number.isInteger(value)) return null

    return (
        <GTDropdownMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            disabled={disabled}
            items={TASK_PRIORITIES.map((priority, index) => ({
                label: priority.label,
                onClick: () => onChange(index),
                icon: priority.icon,
                iconColor: TASK_PRIORITIES[index].color,
                selected: index === value,
            }))}
            trigger={
                condensedTrigger ? (
                    <GTButton
                        styleType="icon"
                        icon={TASK_PRIORITIES[value].icon}
                        iconColor={TASK_PRIORITIES[value].color}
                        tooltipText={TASK_PRIORITIES[value].label}
                        onClick={() => setIsOpen(!isOpen)}
                        active={isOpen}
                        disabled={disabled}
                    />
                ) : (
                    <PriorityDropdownTrigger
                        value={value}
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={disabled}
                        isOpen={isOpen}
                    />
                )
            }
        />
    )
}

export default PriorityDropdown
