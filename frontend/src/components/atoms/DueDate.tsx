import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { getFormattedDate, isValidDueDate } from '../../utils/utils'

export const DueDateContainer = styled.span<{ color: TTextColor }>`
    color: ${(props) => Colors.text[props.color]};
    ${Typography.bodySmall};
`

interface DueDateProps {
    date: Date
}
const DueDate = ({ date }: DueDateProps) => {
    const formattedDate = getFormattedDate(date)
    if (!isValidDueDate(date)) {
        return null
    }
    return <DueDateContainer color={formattedDate.textColor}>{formattedDate.dateString}</DueDateContainer>
}

export default DueDate
