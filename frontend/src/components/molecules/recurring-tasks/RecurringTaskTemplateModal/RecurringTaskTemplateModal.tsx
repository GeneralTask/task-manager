import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { RecurrenceRate } from '../../../../utils/enums'
import { TRecurringTaskTemplate } from '../../../../utils/types'
import GTModal from '../../../atoms/GTModal'
import RecurrenceRateSelector from './RecurrenceRateSelector'

const SettingsForm = styled.div`
    width: 350px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
`

interface RecurringTaskTemplateModalProps {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    initialRecurringTask?: TRecurringTaskTemplate
}
const RecurringTaskTemplateModal = ({ isOpen, setIsOpen, initialRecurringTask }: RecurringTaskTemplateModalProps) => {
    const [recurrenceRate, setRecurrenceRate] = useState(initialRecurringTask?.recurrence_rate ?? RecurrenceRate.DAILY)
    const [selectedDate] = useState(DateTime.local())

    return (
        <GTModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Setting a recurring task" type="medium">
            <div>
                <SettingsForm>
                    <RecurrenceRateSelector
                        value={recurrenceRate}
                        onChange={setRecurrenceRate}
                        selectedDate={selectedDate}
                    />
                </SettingsForm>
            </div>
        </GTModal>
    )
}

export default RecurringTaskTemplateModal
