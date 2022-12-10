import { useState } from 'react'
import CreateNewItemInput from '../CreateNewItemInput'
import RecurringTaskTemplateModal from './RecurringTaskTemplateModal'

const AddRecurringTask = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState('')
    return (
        <>
            <CreateNewItemInput
                placeholder="Create new recurring task"
                initialValue={newTemplateName}
                onChange={setNewTemplateName}
                shortcutName="createRecurringTask"
                onSubmit={() => setIsModalOpen(true)}
            />
            {/* conditionally rendering so that modal re-mounts and resets state after closing */}
            {isModalOpen && (
                <RecurringTaskTemplateModal initialTitle={newTemplateName} onClose={() => setIsModalOpen(false)} />
            )}
        </>
    )
}

export default AddRecurringTask
