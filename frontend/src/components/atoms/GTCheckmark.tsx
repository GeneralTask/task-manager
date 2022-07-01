import React from 'react'
import { icons } from '../../styles/images'
import NoStyleButton from './buttons/NoStyleButton'
import { Icon } from './Icon'

interface GTCheckmarkProps {
    isChecked: boolean
    onChange: (checked: boolean) => void
}
const GTCheckmark = ({ isChecked, onChange }: GTCheckmarkProps) => {
    return (
        <NoStyleButton onClick={() => onChange(!isChecked)}>
            <Icon size="small" source={isChecked ? icons.task_complete : icons.task_incomplete} />
        </NoStyleButton>
    )
}

export default GTCheckmark
