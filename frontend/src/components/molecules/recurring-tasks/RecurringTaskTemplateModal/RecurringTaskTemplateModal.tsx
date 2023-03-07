import { useState } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_FOLDER_ID } from '../../../../constants'
import { useCreateRecurringTask, useModifyRecurringTask } from '../../../../services/api/recurring-tasks.hooks'
import { Border, Colors, Spacing } from '../../../../styles'
import { RecurrenceRate } from '../../../../utils/enums'
import { TRecurringTaskTemplate, TTaskV4 } from '../../../../utils/types'
import { stopKeydownPropogation } from '../../../../utils/utils'
import Flex from '../../../atoms/Flex'
import GTButton from '../../../atoms/buttons/GTButtonNew'
import { BodySmall } from '../../../atoms/typography/Typography'
import GTModal from '../../../mantine/GTModal'
import CreateNewItemInput from '../../CreateNewItemInput'
import { getInitialSelectedDate } from '../recurringTasks.utils'
import DatePicker from './DatePicker'
import RecurrenceRateSelector from './RecurrenceRateSelector'
import TemplateFolderSelector from './TemplateFolderSelector'

const SettingsForm = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border-right: ${Border.stroke.medium} solid ${Colors.background.border};
    padding-right: ${Spacing._24};
`
const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: ${Spacing._24};
`

interface RecurringTaskTemplateModalProps {
    onClose: () => void
    initialTitle?: string // takes precedence over initialTask
    initialRecurringTaskTemplate?: TRecurringTaskTemplate // takes precedence over initial fields below
    initialTask?: TTaskV4
    initialFolderId?: string
}
const RecurringTaskTemplateModal = ({
    onClose,
    initialTask,
    initialRecurringTaskTemplate,
    initialTitle,
    initialFolderId,
}: RecurringTaskTemplateModalProps) => {
    const { mutate: modifyRecurringTask } = useModifyRecurringTask()
    const { mutate: createRecurringTask } = useCreateRecurringTask()

    const [title, setTitle] = useState(initialTitle ?? initialRecurringTaskTemplate?.title ?? initialTask?.title ?? '')
    const [recurrenceRate, setRecurrenceRate] = useState(
        initialRecurringTaskTemplate?.recurrence_rate ?? RecurrenceRate.WEEKLY
    )
    const [folder, setFolder] = useState(
        initialRecurringTaskTemplate?.id_task_section ?? initialFolderId ?? DEFAULT_FOLDER_ID
    )
    const [selectedDate, setSelectedDate] = useState<DateTime>(() =>
        getInitialSelectedDate(initialRecurringTaskTemplate)
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
            size="sm"
            tabs={{
                title: `${initialRecurringTaskTemplate ? 'Edit' : 'Create'} a recurring task`,
                body: (
                    <>
                        <Flex flex="1" onKeyDown={handleKeyDown} justifyContent="space-between">
                            <SettingsForm>
                                <CreateNewItemInput
                                    placeholder="Recurring task title"
                                    initialValue={title}
                                    autoFocus
                                    hideIcon
                                    onChange={setTitle}
                                    onSubmit={handleSave}
                                />
                                <Flex column gap={Spacing._12}>
                                    <BodySmall>Which folder should this task appear in?</BodySmall>
                                    <TemplateFolderSelector value={folder} onChange={setFolder} useTriggerWidth />
                                </Flex>
                                <RecurrenceRateSelector
                                    value={recurrenceRate}
                                    onChange={setRecurrenceRate}
                                    selectedDate={selectedDate}
                                />
                            </SettingsForm>
                            <DatePicker date={selectedDate} setDate={setSelectedDate} recurrenceRate={recurrenceRate} />
                        </Flex>
                        <Footer>
                            <GTButton styleType="primary" value="Save" onClick={handleSave} disabled={!isValid} />
                        </Footer>
                    </>
                ),
            }}
        />
    )
}

export default RecurringTaskTemplateModal
