import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { getFormattedDate } from '../../utils/utils'

export const DueDateContainer = styled.span<{ color: TTextColor }>`
    color: ${(props) => Colors.text[props.color]};
    ${Typography.bodySmall};
`

interface DueDateProps {
    date: DateTime
    isDoneOrDeleted: boolean
}
const DueDate = ({ date, isDoneOrDeleted }: DueDateProps) => {
    const formattedDate = getFormattedDate(date, isDoneOrDeleted)
    if (!date.isValid) {
        return null
    }
    return <DueDateContainer color={formattedDate.textColor}>{formattedDate.dateString}</DueDateContainer>
}

export default DueDate
