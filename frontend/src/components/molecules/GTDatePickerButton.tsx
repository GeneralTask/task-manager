import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { icons } from '../../styles/images'
import { getFormattedDate } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'

interface GTDatePickerButtonProps {
    currentDate: DateTime | null
    showIcon?: boolean
    onClick: React.MouseEventHandler<HTMLButtonElement>
    isOpen: boolean
    disabled: boolean
    overrideDisabledStyle?: boolean
}
const GTDatePickerButton = ({ currentDate, showIcon, onClick, isOpen, disabled }: GTDatePickerButtonProps) => {
    const formattedDate = useMemo(() => getFormattedDate(currentDate), [currentDate])

    return (
        <GTButton
            icon={showIcon ? icons.clock : undefined}
            value={formattedDate.dateString}
            textColor={formattedDate.textColor}
            iconColor={formattedDate.iconColor}
            onClick={onClick}
            active={isOpen}
            disabled={disabled}
            styleType="control"
        />
    )
}

export default GTDatePickerButton
