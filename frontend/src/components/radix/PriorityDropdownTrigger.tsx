import { forwardRef } from 'react'
import { TASK_PRIORITIES } from '../../constants'
import GTButton from '../atoms/buttons/GTButton'

interface PriorityDropdownTriggerProps {
    value: number
    onClick: () => void
    disabled?: boolean
    overrideDisabledStyle?: boolean
}
const PriorityDropdownTrigger = forwardRef<HTMLButtonElement, PriorityDropdownTriggerProps>((props, ref) => {
    return (
        <GTButton
            ref={ref}
            value={TASK_PRIORITIES[props.value].label}
            icon={TASK_PRIORITIES[props.value].icon}
            styleType="control"
            iconColor={TASK_PRIORITIES[props.value].color}
            onClick={props.onClick}
            disabled={props.disabled}
            overrideDisabledStyle={props.overrideDisabledStyle}
        />
    )
})

export default PriorityDropdownTrigger
