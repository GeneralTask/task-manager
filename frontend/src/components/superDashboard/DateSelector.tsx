import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { BodyLarge } from '../atoms/typography/Typography'
import { DAYS_PER_WEEK } from './constants'

const DateRange = styled(BodyLarge)`
    min-width: 150px;
`

interface DateSelectorProps {
    startDate: DateTime
    setStartDate: (date: DateTime) => void
}
const DateSelector = ({ startDate, setStartDate }: DateSelectorProps) => {
    const endDate = startDate.plus({ days: DAYS_PER_WEEK - 1 })
    const startDateStr = startDate.toFormat('MMM d')
    const endDateStr = endDate.toFormat('MMM d')
    return (
        <Flex alignItems="center">
            <DateRange color="muted">
                {startDateStr} - {endDateStr}
            </DateRange>
            <Flex alignItems="center" gap={Spacing._8}>
                <GTIconButton
                    icon={icons.arrow_left}
                    tooltipText="Previous week"
                    onClick={() => setStartDate(startDate.minus({ week: 1 }))}
                />
                <GTIconButton
                    icon={icons.arrow_right}
                    tooltipText="Next week"
                    onClick={() => setStartDate(startDate.plus({ week: 1 }))}
                />
            </Flex>
        </Flex>
    )
}

export default DateSelector
