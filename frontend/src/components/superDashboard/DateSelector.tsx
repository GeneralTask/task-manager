import { useMemo } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { BodyLarge } from '../atoms/typography/Typography'
import { useSuperDashboardContext } from './SuperDashboardContext'

const DateRange = styled(BodyLarge)`
    min-width: 150px;
`

const DateSelector = () => {
    const { dashboard, selectedInterval, setSelectedInterval } = useSuperDashboardContext()
    const startDate = DateTime.fromFormat(selectedInterval.date_start, 'yyyy-MM-dd')
    const endDate = DateTime.fromFormat(selectedInterval.date_end, 'yyyy-MM-dd')

    const selectedIntervalIndex = useMemo(
        () => dashboard.intervals.findIndex((interval) => interval == selectedInterval),
        [dashboard.intervals, selectedInterval]
    )
    const canSelectPreviousInterval = dashboard.intervals.length > 1 && selectedIntervalIndex > 0
    const canSelectNextInterval =
        dashboard.intervals.length > 1 && selectedIntervalIndex < dashboard.intervals.length - 1
    const selectPreviousInterval = () => {
        if (canSelectPreviousInterval) {
            setSelectedInterval(dashboard.intervals[selectedIntervalIndex - 1])
        }
    }
    const selectNextInterval = () => {
        if (canSelectNextInterval) {
            setSelectedInterval(dashboard.intervals[selectedIntervalIndex + 1])
        }
    }

    return (
        <Flex alignItems="center">
            <DateRange color="muted">
                {startDate.toFormat('MMM d')} - {endDate.toFormat('MMM d')}
            </DateRange>
            <Flex alignItems="center" gap={Spacing._8}>
                <GTIconButton
                    icon={icons.arrow_left}
                    tooltipText="Previous week"
                    disabled={!canSelectPreviousInterval}
                    onClick={selectPreviousInterval}
                />
                <GTIconButton
                    icon={icons.arrow_right}
                    tooltipText="Next week"
                    disabled={!canSelectNextInterval}
                    onClick={selectNextInterval}
                />
            </Flex>
        </Flex>
    )
}

export default DateSelector
