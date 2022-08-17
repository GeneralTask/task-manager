import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import GTButton from '../atoms/buttons/GTButton'
import GTModal from '../atoms/GTModal'
import CalendarView from '../views/CalendarView'
import TaskList from '../views/TaskListView'

interface CalendarTriageModalProps {
    isOpen: boolean
    onClose: () => void
}

const CalendarTriageContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
`

const CalendarTriageModal = ({ isOpen, onClose }: CalendarTriageModalProps) => {
    const { section: sectionId } = useParams()
    const { data: taskSections } = useGetTasks()

    const section = taskSections?.find(({ id }) => id === sectionId)

    return (
        <GTModal
            isOpen={isOpen}
            title="Schedule Tasks"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="large"
        >
            <CalendarTriageContainer>
                <div style={{ width: '30%' }}>
                    <TaskList section={section!} />
                </div>
                <div style={{ width: '70%' }}>
                    <CalendarView isExpanded={true} />
                </div>
            </CalendarTriageContainer>
        </GTModal>
    )
}

export default CalendarTriageModal
