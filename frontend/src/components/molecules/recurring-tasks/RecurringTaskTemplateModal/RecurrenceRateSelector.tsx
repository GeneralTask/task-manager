import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { Spacing } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'
import { getOrdinal } from '../../../../utils/time'
import Flex from '../../../atoms/Flex'
import GTButton from '../../../atoms/buttons/GTButton'
import { BodySmall } from '../../../atoms/typography/Typography'
import GTDropdownMenu from '../../../radix/GTDropdownMenu'

interface RecurrenceRateSelectorProps {
    value: RecurrenceRate
    onChange: (value: RecurrenceRate) => void
    selectedDate: DateTime
}
const RecurrenceRateSelector = ({ value, onChange, selectedDate }: RecurrenceRateSelectorProps) => {
    const recurrenceRateLabels: [RecurrenceRate, string][] = useMemo(
        () => [
            [RecurrenceRate.DAILY, 'Daily'],
            [RecurrenceRate.WEEK_DAILY, `Weekly on ${selectedDate.weekdayLong}`],
            [RecurrenceRate.WEEKLY, `Monthly on ${getOrdinal(selectedDate.day)} ${selectedDate.weekdayLong}`],
            [RecurrenceRate.MONTHLY, `Annually on ${selectedDate.monthShort} ${getOrdinal(selectedDate.day)}`],
            [RecurrenceRate.YEARLY, 'Every weekday (Monday to Friday)'],
        ],
        [selectedDate]
    )

    return (
        <Flex column gap={Spacing._12}>
            <BodySmall>How often would you like this task to repeat?</BodySmall>
            <GTDropdownMenu
                menuInModal
                useTriggerWidth
                fontStyle="label"
                items={recurrenceRateLabels.map(([rate, label]) => ({
                    label,
                    onClick: () => onChange(rate),
                    selected: value === rate,
                }))}
                trigger={
                    <GTButton
                        isDropdown
                        styleType="simple"
                        fitContent={false}
                        size="small"
                        value={recurrenceRateLabels.find(([rate]) => rate === value)?.[1] || 'Select a recurrence rate'}
                    />
                }
            />
        </Flex>
    )
}

export default RecurrenceRateSelector
