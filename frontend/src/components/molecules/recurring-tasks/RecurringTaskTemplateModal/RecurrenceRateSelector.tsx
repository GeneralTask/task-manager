import { DateTime } from 'luxon'
import { Spacing } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'
import { getOrdinal } from '../../../../utils/time'
import Flex from '../../../atoms/Flex'
import { BodySmall } from '../../../atoms/typography/Typography'
import GTSelect from '../../../radix/GTSelect'

/*
    The core radix Select component only selects strings, so the RECURRENCE_RATE enum is converted to a string in order to be used here.
*/

interface RecurrenceRateSelectorProps {
    value: RecurrenceRate
    onChange: (value: RecurrenceRate) => void
    selectedDate: DateTime
}
const RecurrenceRateSelector = ({ value, onChange, selectedDate }: RecurrenceRateSelectorProps) => {
    return (
        <Flex column gap={Spacing._12}>
            <BodySmall>How often would you like this task to repeat?</BodySmall>
            <GTSelect
                items={[
                    { value: RecurrenceRate.DAILY.toString(), label: 'Daily' },
                    { value: RecurrenceRate.WEEKLY.toString(), label: `Weekly on ${selectedDate.weekdayLong}` },
                    {
                        value: RecurrenceRate.MONTHLY.toString(),
                        label: `Monthly on the ${getOrdinal(selectedDate.day)}`,
                    },
                    {
                        value: RecurrenceRate.YEARLY.toString(),
                        label: `Annually on ${selectedDate.monthShort} ${getOrdinal(selectedDate.day)}`,
                    },
                    { value: RecurrenceRate.WEEK_DAILY.toString(), label: 'Every weekday (Monday to Friday)' },
                ]}
                value={value.toString()}
                onChange={(newValue) => onChange(parseInt(newValue))}
            />
        </Flex>
    )
}

export default RecurrenceRateSelector
