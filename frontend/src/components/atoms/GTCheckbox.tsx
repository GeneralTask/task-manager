import React from 'react'
import { icons } from '../../styles/images'
import NoStyleButton from './buttons/NoStyleButton'
import { Icon } from './Icon'

interface GTCheckboxProps {
    isChecked: boolean
    onChange: (checked: boolean) => void
}
const GTCheckbox = ({ isChecked, onChange }: GTCheckboxProps) => {
    const onClickHandler = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) e.stopPropagation()
        onChange(!isChecked)
    }
    return (
        <NoStyleButton onClick={onClickHandler}>
            <Icon size="small" source={isChecked ? icons.task_complete : icons.task_incomplete} />
        </NoStyleButton>
    )
}

export default GTCheckbox
