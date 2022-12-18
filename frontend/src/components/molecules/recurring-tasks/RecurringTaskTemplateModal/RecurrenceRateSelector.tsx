import { DateTime } from 'luxon'
import { Spacing } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'
import Flex from '../../../atoms/Flex'
import { BodySmall } from '../../../atoms/typography/Typography'
import GTSelect from '../../../radix/GTSelect'
import { getRecurrenceRateSelectorOptions } from '../recurringTasks.utils'

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
                items={getRecurrenceRateSelectorOptions(selectedDate)}
                value={value.toString()}
                onChange={(newValue) => onChange(parseInt(newValue))}
                useTriggerWidth
            />
        </Flex>
    )
}

export default RecurrenceRateSelector
