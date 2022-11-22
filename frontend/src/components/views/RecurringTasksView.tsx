import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const RecurringTasksView = () => {
    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Recurring tasks" />
        </ScrollableListTemplate>
    )
}

export default RecurringTasksView
