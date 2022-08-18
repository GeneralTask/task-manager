import React, { useState } from 'react'
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
    height: 100%;
    flex-direction: row;
    overflow: hidden;
`

const CalendarTriageModal = ({ isOpen, onClose }: CalendarTriageModalProps) => {
    const { section: sectionId } = useParams()
    const { data: taskSections } = useGetTasks()
    const [isExpanded, setIsExpanded] = useState(true)

    const section = taskSections?.find(({ id }) => id === sectionId)
    if (!section) return null

    return (
        <GTModal
            isOpen={isOpen}
            title="Schedule Tasks"
            onClose={onClose}
            rightButtons={<GTButton value="Done" styleType="primary" onClick={onClose} />}
            type="large"
        >
            <CalendarTriageContainer>
                <div style={{ width: '30%', overflow: 'scroll' }}>
                    <TaskList section={section!} />
                </div>
                <div style={{ width: '70%' }}>
                    <CalendarView isExpanded={isExpanded} setIsExpanded={setIsExpanded} showExpandOptions={false} />
                </div>
            </CalendarTriageContainer>
        </GTModal>
    )
}

export default CalendarTriageModal
