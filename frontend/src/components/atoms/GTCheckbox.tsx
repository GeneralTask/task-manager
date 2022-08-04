import React from 'react'
import { Colors } from '../../styles'
import { TIconSize } from '../../styles/dimensions'
import { icons } from '../../styles/images'
import NoStyleButton from './buttons/NoStyleButton'
import { Icon } from './Icon'

interface GTCheckboxProps {
    isChecked: boolean
    onChange: (checked: boolean) => void
    size?: TIconSize
    disabled?: boolean
}
const GTCheckbox = ({ isChecked, onChange, size, disabled }: GTCheckboxProps) => {
    const onClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onChange(!isChecked)
    }
    size = size || 'small'
    return (
        <NoStyleButton onClick={onClickHandler} disabled={disabled}>
            <Icon size={size} icon={isChecked ? icons.check : icons.check_unchecked} color={Colors.icon.purple} />
        </NoStyleButton>
    )
}

export default GTCheckbox
