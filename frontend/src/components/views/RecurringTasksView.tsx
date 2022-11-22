import { useRecurringTaskTemplates } from '../../services/api/recurring-tasks.hooks'
import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const RecurringTasksView = () => {
    const { data: recurringTaskTemplates } = useRecurringTaskTemplates()
    console.log(recurringTaskTemplates)
    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Recurring tasks" />
        </ScrollableListTemplate>
    )
}

export default RecurringTasksView
