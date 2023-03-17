import { TASK_PRIORITIES } from '../../constants'
import GTButton from '../atoms/buttons/GTButton'

interface PriorityDropdownTriggerProps {
    value: number
}
const PriorityDropdownTrigger = ({ value }: PriorityDropdownTriggerProps) => {
    return (
        <GTButton
            value={TASK_PRIORITIES[value].label}
            icon={TASK_PRIORITIES[value].icon}
            iconColor={TASK_PRIORITIES[value].color}
            styleType="control"
            disabled
            overrideDisabledStyle
        />
    )
}

export default PriorityDropdownTrigger
