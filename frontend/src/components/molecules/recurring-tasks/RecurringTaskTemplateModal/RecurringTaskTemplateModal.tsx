import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_SECTION_ID } from '../../../../constants'
import { useCreateRecurringTask, useModifyRecurringTask } from '../../../../services/api/recurring-tasks.hooks'
import { Border, Colors, Spacing } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'
import { TRecurringTaskTemplate, TTask } from '../../../../utils/types'
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
    border-right: ${Border.stroke.medium} solid ${Colors.border.extra_light};
    padding-right: ${Spacing._32};
`

interface RecurringTaskTemplateModalProps {
    onClose: () => void
    initialRecurringTaskTemplate?: TRecurringTaskTemplate // takes precedence over initial fields below
    initialTask?: TTask
    initialFolderId?: string
}
const RecurringTaskTemplateModal = ({
    onClose,
    initialRecurringTaskTemplate,
    initialTask,
    initialFolderId,
}: RecurringTaskTemplateModalProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const { mutate: createRecurringTask } = useCreateRecurringTask()

    const [title, setTitle] = useState(initialRecurringTaskTemplate?.title ?? initialTask?.title ?? '')
    const [recurrenceRate, setRecurrenceRate] = useState(
        initialRecurringTaskTemplate?.recurrence_rate ?? RecurrenceRate.DAILY
    )
    const [folder, setFolder] = useState(
        initialRecurringTaskTemplate?.id_task_section ?? initialFolderId ?? DEFAULT_SECTION_ID
    )
    const [selectedDate, setSelectedDate] = useState<DateTime>(
        initialRecurringTaskTemplate?.day_to_create_task && initialRecurringTaskTemplate?.day_to_create_task
            ? DateTime.fromObject({
                  day: initialRecurringTaskTemplate.day_to_create_task,
                  month: initialRecurringTaskTemplate.month_to_create_task,
              })
            : DateTime.local()
    )
    const isValid = !!title.trim()

    const handleSave = () => {
        if (!isValid) return
        let dayToCreateTask: number | undefined = undefined
        if (recurrenceRate === RecurrenceRate.WEEKLY) {
            dayToCreateTask = selectedDate.weekday
        } else if (recurrenceRate === RecurrenceRate.MONTHLY || recurrenceRate === RecurrenceRate.YEARLY) {
            dayToCreateTask = selectedDate.day
        }
        const payload = {
            title,
            recurrence_rate: recurrenceRate,
            id_task_section: folder,
            day_to_create_task: dayToCreateTask,
            month_to_create_task: recurrenceRate === RecurrenceRate.YEARLY ? selectedDate.month : undefined,
        }
        if (initialRecurringTaskTemplate) {
            // modifying a template
            modifyRecurringTask(
                {
                    id: initialRecurringTaskTemplate.id,
                    ...payload,
                },
                initialRecurringTaskTemplate.optimisticId
            )
        } else {
            // creating a new template
            createRecurringTask({
                ...payload,
                optimisticId: uuidv4(),
                time_of_day_seconds_to_create_task: 0,
                body: initialTask?.body,
                priority_normalized: initialTask?.priority_normalized,
                task_id: initialTask?.id,
            })
        }
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave()
        }
        stopKeydownPropogation(e, undefined, true)
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
                        <Flex flex="1" onKeyDown={handleKeyDown}>
                            <SettingsForm>
                                {!initialRecurringTaskTemplate && !initialTask && (
                                    <NewTemplateNameInput value={title} onChange={setTitle} />
                                )}
                                {!initialRecurringTaskTemplate && (
                                    <NewTemplateFolderSelector value={folder} onChange={setFolder} />
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
