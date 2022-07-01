import React from 'react'
import { TIconSize } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import NoStyleButton from './buttons/NoStyleButton'
import { Icon } from './Icon'

interface GTCheckboxProps {
    isChecked: boolean
    onChange: (checked: boolean) => void
    size?: TIconSize
}
const GTCheckbox = ({ isChecked, onChange, size }: GTCheckboxProps) => {
    const onClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onChange(!isChecked)
    }
    size = size || 'small'
    return (
        <NoStyleButton onClick={onClickHandler}>
            <Icon size={size} source={isChecked ? icons.task_complete : icons.task_incomplete} />
        </NoStyleButton>
    )
}

export default GTCheckbox
