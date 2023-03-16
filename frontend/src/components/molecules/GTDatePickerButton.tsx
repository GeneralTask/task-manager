import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { icons } from '../../styles/images'
import { getFormattedDate } from '../../utils/utils'
import GTButton from '../atoms/buttons/GTButton'

interface GTDatePickerButtonProps {
    currentDate: DateTime | null
}
const GTDatePickerButton = ({ currentDate }: GTDatePickerButtonProps) => {
    const formattedDate = useMemo(() => getFormattedDate(currentDate), [currentDate])

    return (
        <GTButton
            styleType="control"
            icon={icons.clock}
            value={formattedDate.dateString}
            textColor={formattedDate.textColor}
            iconColor={formattedDate.iconColor}
            disabled
            overrideDisabledStyle
        />
    )
}

export default GTDatePickerButton
