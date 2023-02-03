import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useBackfillRecurringTasks, useRecurringTaskTemplates } from '../../services/api/recurring-tasks.hooks'
import { icons } from '../../styles/images'
import sortAndFilterItems from '../../utils/sortAndFilter/sortAndFilterItems'
import useSortAndFilterSettings from '../../utils/sortAndFilter/useSortAndFilterSettings'
import { TRecurringTaskTemplate } from '../../utils/types'
import { EMPTY_ARRAY } from '../../utils/utils'
import Flex from '../atoms/Flex'
import Spinner from '../atoms/Spinner'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import { SectionHeader } from '../molecules/Header'
import AddRecurringTask from '../molecules/recurring-tasks/AddRecurringTask'
import RecurringTask from '../molecules/recurring-tasks/RecurringTask'
import { RECURRING_TASK_SORT_AND_FILTER_CONFIG } from '../molecules/recurring-tasks/recurring-task.config'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const RecurringTasksView = () => {
    const { data: recurringTaskTemplates } = useRecurringTaskTemplates()
    useBackfillRecurringTasks()

    const { recurringTaskId } = useParams()
    const navigate = useNavigate()
    const { calendarType } = useCalendarContext()

    const sortAndFilterSettings = useSortAndFilterSettings<TRecurringTaskTemplate>(
        RECURRING_TASK_SORT_AND_FILTER_CONFIG
    )
    const { selectedFilter, isLoading: areSettingsLoading } = sortAndFilterSettings
    const filteredRecurringTasks = useMemo(() => {
        if (!recurringTaskTemplates || areSettingsLoading) return EMPTY_ARRAY
        return sortAndFilterItems({
            items: recurringTaskTemplates,
            filter: selectedFilter,
            tieBreakerField: RECURRING_TASK_SORT_AND_FILTER_CONFIG.tieBreakerField,
        })
    }, [recurringTaskTemplates, selectedFilter, areSettingsLoading])

    const selectedRecurringTask = useMemo(() => {
        if (filteredRecurringTasks == null || filteredRecurringTasks.length === 0) return null
        return filteredRecurringTasks.find((pr) => pr.id === recurringTaskId) ?? filteredRecurringTasks[0]
    }, [recurringTaskId, filteredRecurringTasks])

    useEffect(() => {
        if (selectedRecurringTask == null) return
        navigate(`/recurring-tasks/${selectedRecurringTask.id}`, { replace: true })
    }, [selectedRecurringTask])

    const selectRecurringTask = useCallback((recurringTask: TRecurringTaskTemplate) => {
        navigate(`/recurring-tasks/${recurringTask.id}`)
        Log(`recurring_task_select_${recurringTask.id}`)
    }, [])

    useItemSelectionController(filteredRecurringTasks ?? EMPTY_ARRAY, selectRecurringTask)

    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <SectionHeader sectionName="Recurring tasks" />
                    {!filteredRecurringTasks ? (
                        <Spinner />
                    ) : (
                        <>
                            <AddRecurringTask />
                            {filteredRecurringTasks.map((recurringTask) => (
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
            </Flex>
            {calendarType === 'day' && (
                <>
                    {selectedRecurringTask ? (
                        <TaskDetails task={selectedRecurringTask} isRecurringTaskTemplate />
                    ) : (
                        <EmptyDetails icon={icons.arrows_repeat} text="You have no recurring tasks" />
                    )}
                </>
            )}
        </>
    )
}

export default RecurringTasksView
