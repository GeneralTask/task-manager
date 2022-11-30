import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { RecurrenceRate } from '../../../../utils/enums'
import { TRecurringTaskTemplate } from '../../../../utils/types'
import GTModal from '../../../mantine/GTModal'
import RecurrenceRateSelector from './RecurrenceRateSelector'

const SettingsForm = styled.div`
    width: 350px;
    height: 60vh;
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
        <GTModal
            open={isOpen}
            setIsModalOpen={setIsOpen}
            size="lg"
            tabs={{
                title: 'Setting a recurring task',
                body: (
                    <div>
                        <SettingsForm>
                            <RecurrenceRateSelector
                                value={recurrenceRate}
                                onChange={setRecurrenceRate}
                                selectedDate={selectedDate}
                            />
                        </SettingsForm>
                    </div>
                ),
            }}
        />
    )
}

export default RecurringTaskTemplateModal
