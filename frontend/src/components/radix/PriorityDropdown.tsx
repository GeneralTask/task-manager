import { TASK_PRIORITIES } from '../../constants'
import GTButton from '../atoms/buttons/GTButton'
import GTDropdownMenu from './GTDropdownMenu'

interface PriorityDropdownProps {
    value: number
    onChange: (priority: number) => void
    disabled?: boolean
    condensedTrigger?: boolean
}
const PriorityDropdown = ({ value, onChange, disabled, condensedTrigger }: PriorityDropdownProps) => {
    if (!Number.isInteger(value)) return null

    return (
        <GTDropdownMenu
            disabled={disabled}
            items={TASK_PRIORITIES.map((priority, index) => ({
                label: priority.label,
                onClick: () => onChange(index),
                icon: priority.icon,
                iconColor: TASK_PRIORITIES[index].color,
                selected: index === value,
            }))}
            trigger={
                <GTButton
                    styleType={condensedTrigger ? 'icon' : 'control'}
                    value={condensedTrigger ? undefined : TASK_PRIORITIES[value].label}
                    icon={TASK_PRIORITIES[value].icon}
                    iconColor={TASK_PRIORITIES[value].color}
                    tooltipText={condensedTrigger ? TASK_PRIORITIES[value].label : undefined}
                    disabled={disabled}
                />
            }
        />
    )
}

export default PriorityDropdown
