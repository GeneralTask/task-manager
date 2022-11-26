import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SECTION_ID } from '../../../../constants'
import { useCreateRecurringTask, useModifyRecurringTask } from '../../../../services/api/recurring-tasks.hooks'
import { RecurrenceRate } from '../../../../utils/enums'
import { TRecurringTaskTemplate } from '../../../../utils/types'
import { stopKeydownPropogation } from '../../../../utils/utils'
import Flex from '../../../atoms/Flex'
import GTModal from '../../../atoms/GTModal'
import GTButton from '../../../atoms/buttons/GTButton'
import RecurrenceRateSelector from './RecurrenceRateSelector'
import TemplateNameInput from './TemplateNameInput'

const SettingsForm = styled.div`
    width: 350px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`

interface RecurringTaskTemplateModalProps {
    setIsOpen: (isOpen: boolean) => void
    initialRecurringTask?: TRecurringTaskTemplate
}
const RecurringTaskTemplateModal = ({ setIsOpen, initialRecurringTask }: RecurringTaskTemplateModalProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const { mutate: createRecurringTask } = useCreateRecurringTask()

    const [name, setName] = useState(initialRecurringTask?.title ?? '')
    const [recurrenceRate, setRecurrenceRate] = useState(initialRecurringTask?.recurrence_rate ?? RecurrenceRate.DAILY)
    const [selectedDate] = useState<DateTime>(
        initialRecurringTask?.day_to_create_task && initialRecurringTask?.day_to_create_task
            ? DateTime.fromObject({
                  day: initialRecurringTask.day_to_create_task,
                  month: initialRecurringTask.month_to_create_task,
              })
            : DateTime.local()
    )
    const isValid = name !== ''

    const handleSave = () => {
        if (!isValid) return
        const payload = {
            title: name,
            recurrence_rate: recurrenceRate,
        }
        if (initialRecurringTask) {
            // modifying a template
            modifyRecurringTask(
                {
                    id: initialRecurringTask.id,
                    ...payload,
                },
                initialRecurringTask.optimisticId
            )
        } else {
            // creating a new template
            createRecurringTask({
                ...payload,
                optimisticId: uuidv4(),
                id_task_section: DEFAULT_SECTION_ID,
                time_of_day_seconds_to_create_task: 0,
            })
        }
        setIsOpen(false)
    }

    return (
        <GTModal isOpen onClose={() => setIsOpen(false)} title="Setting a recurring task" type="medium">
            <Flex flex="1" onKeyDown={(e) => stopKeydownPropogation(e, undefined, true)}>
                <SettingsForm>
                    {!initialRecurringTask && <TemplateNameInput value={name} onChange={setName} />}
                    <RecurrenceRateSelector
                        value={recurrenceRate}
                        onChange={setRecurrenceRate}
                        selectedDate={selectedDate}
                    />
                </SettingsForm>
            </Flex>
            <Flex justifyContent="space-between">
                <GTButton value="Cancel" styleType="secondary" onClick={() => setIsOpen(false)} />
                <GTButton value="Save" onClick={handleSave} disabled={!isValid} />
            </Flex>
        </GTModal>
    )
}

export default RecurringTaskTemplateModal
