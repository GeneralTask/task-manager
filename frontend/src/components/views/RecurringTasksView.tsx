import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useRecurringTaskTemplates } from '../../services/api/recurring-tasks.hooks'
import { icons } from '../../styles/images'
import { TRecurringTaskTemplate } from '../../utils/types'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import { SectionHeader } from '../molecules/Header'
import AddRecurringTask from '../molecules/recurring-tasks/AddRecurringTask'
import RecurringTask from '../molecules/recurring-tasks/RecurringTask'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const RecurringTasksView = () => {
    const { data: recurringTaskTemplates } = useRecurringTaskTemplates()
    const { recurringTaskId } = useParams()
    const navigate = useNavigate()

    const selectedRecurringTask = useMemo(() => {
        if (recurringTaskTemplates == null || recurringTaskTemplates.length === 0) return null
        return recurringTaskTemplates.find((pr) => pr.id === recurringTaskId) ?? recurringTaskTemplates[0]
    }, [recurringTaskId, recurringTaskTemplates])

    useEffect(() => {
        if (selectedRecurringTask == null) return
        navigate(`/recurring-tasks/${selectedRecurringTask.id}`, { replace: true })
    }, [selectedRecurringTask])

    const selectRecurringTask = useCallback((recurringTask: TRecurringTaskTemplate) => {
        navigate(`/recurring-tasks/${recurringTask.id}`)
        Log(`recurring_task_select_${recurringTask.id}`)
    }, [])

    useItemSelectionController(recurringTaskTemplates ?? [], selectRecurringTask)

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Recurring tasks" />
                {!recurringTaskTemplates ? (
                    <Spinner />
                ) : (
                    <>
                        <AddRecurringTask />
                        {recurringTaskTemplates.map((recurringTask) => (
                            <RecurringTask
                                key={recurringTask.id}
                                recurringTask={recurringTask}
                                isSelected={recurringTask.id === recurringTaskId}
                                onSelect={selectRecurringTask}
                            />
                        ))}
                    </>
                )}
            </ScrollableListTemplate>
            {selectedRecurringTask ? (
                <TaskDetails
                    task={selectedRecurringTask}
                    link={`/recurring-tasks/${selectedRecurringTask.id}`}
                    isRecurringTaskTemplate
                />
            ) : (
                <EmptyDetails icon={icons.arrows_repeat} text={`Details view coming soon`} />
            )}
        </>
    )
}

export default RecurringTasksView
