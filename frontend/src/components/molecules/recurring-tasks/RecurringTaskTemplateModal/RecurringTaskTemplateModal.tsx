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
import GTButton from '../../../atoms/buttons/GTButton'
import GTModal from '../../../mantine/GTModal'
import DatePicker from './DatePicker'
import NewTemplateFolderSelector from './NewTemplateFolderSelector'
import NewTemplateNameInput from './NewTemplateNameInput'
import RecurrenceRateSelector from './RecurrenceRateSelector'

const SettingsForm = styled.div`
    flex: 1;
    height: 50vh;
    display: flex;
    flex-direction: column;
    gap: 20px;
`

interface RecurringTaskTemplateModalProps {
    onClose: () => void
    initialRecurringTask?: TRecurringTaskTemplate
}
const RecurringTaskTemplateModal = ({ onClose, initialRecurringTask }: RecurringTaskTemplateModalProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const { mutate: createRecurringTask } = useCreateRecurringTask()

    const [title, setTitle] = useState(initialRecurringTask?.title ?? '')
    const [recurrenceRate, setRecurrenceRate] = useState(initialRecurringTask?.recurrence_rate ?? RecurrenceRate.DAILY)
    const [folder, setFolder] = useState(initialRecurringTask?.id_task_section ?? DEFAULT_SECTION_ID)
    const [selectedDate, setSelectedDate] = useState<DateTime>(
        initialRecurringTask?.day_to_create_task && initialRecurringTask?.day_to_create_task
            ? DateTime.fromObject({
                  day: initialRecurringTask.day_to_create_task,
                  month: initialRecurringTask.month_to_create_task,
              })
            : DateTime.local()
    )

    const isValid = !!title.trim()

    const handleSave = () => {
        if (!isValid) return
        const payload = {
            title,
            recurrence_rate: recurrenceRate,
            id_task_section: folder,
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
                time_of_day_seconds_to_create_task: 0,
            })
        }
        onClose()
    }

    return (
        <GTModal
            open
            setIsModalOpen={onClose}
            size="lg"
            tabs={{
                title: 'Setting a recurring task',
                body: (
                    <>
                        <Flex flex="1" onKeyDown={(e) => stopKeydownPropogation(e, undefined, true)}>
                            <SettingsForm>
                                {!initialRecurringTask && (
                                    <>
                                        <NewTemplateNameInput value={title} onChange={setTitle} />
                                        <NewTemplateFolderSelector value={folder} onChange={setFolder} />
                                    </>
                                )}
                                <RecurrenceRateSelector
                                    value={recurrenceRate}
                                    onChange={setRecurrenceRate}
                                    selectedDate={selectedDate}
                                />
                            </SettingsForm>
                            <DatePicker date={selectedDate} setDate={setSelectedDate} recurrenceRate={recurrenceRate} />
                        </Flex>
                        <Flex justifyContent="space-between">
                            <GTButton value="Cancel" styleType="secondary" onClick={onClose} />
                            <GTButton value="Save" onClick={handleSave} disabled={!isValid} />
                        </Flex>
                    </>
                ),
            }}
        />
    )
}

export default RecurringTaskTemplateModal
