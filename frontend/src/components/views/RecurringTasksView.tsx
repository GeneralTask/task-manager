import { useRecurringTaskTemplates } from '../../services/api/recurring-tasks.hooks'
import { icons } from '../../styles/images'
import Spinner from '../atoms/Spinner'
import EmptyDetails from '../details/EmptyDetails'
import { SectionHeader } from '../molecules/Header'
import RecurringTask from '../molecules/recurring-tasks/RecurringTask'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const RecurringTasksView = () => {
    const { data: recurringTaskTemplates } = useRecurringTaskTemplates()

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Recurring tasks" />
                {!recurringTaskTemplates ? (
                    <Spinner />
                ) : (
                    recurringTaskTemplates.map((recurringTask) => (
                        <RecurringTask key={recurringTask.id} recurringTask={recurringTask} />
                    ))
                )}
            </ScrollableListTemplate>
            <EmptyDetails icon={icons.arrows_repeat} text="Details view coming soon" />
        </>
    )
}

export default RecurringTasksView
