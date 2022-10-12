import { useRef, useState } from 'react'
import styled from 'styled-components'
import { useClickOutside } from '../../hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { getSectionFromTask } from '../../utils/utils'
import ButtonWithText from '../atoms/buttons/ButtonWithText'
import CreateNewSubtask from './CreateNewSubtask'
import Subtask from './Subtask'

const AddTaskbutton = styled(ButtonWithText)`
    margin-bottom: ${Spacing._16};
`
const TaskListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
`

interface SubtasksProps {
    taskId: string
}

const SubtaskList = ({ taskId }: SubtasksProps) => {
    const { data: taskSections } = useGetTasks()
    const sectionId = getSectionFromTask(taskSections ?? [], taskId)?.id
    const subtasks =
        taskSections?.find((section) => section.id === sectionId)?.tasks.find((task) => task.id === taskId)
            ?.sub_tasks ?? []
    const [showCreateNewSubtask, setShowCreateNewSubtask] = useState(false)
    const ref = useRef<HTMLInputElement>(null)

    useClickOutside(ref, () => {
        setShowCreateNewSubtask(false)
    })

    return (
        <div>
            <AddTaskbutton
                text="Add new subtask"
                icon={icons.plus}
                clickHandler={() => setShowCreateNewSubtask(true)}
            />
            <TaskListContainer>
                {showCreateNewSubtask && sectionId && (
                    <CreateNewSubtask
                        ref={ref}
                        parentTaskId={taskId}
                        sectionId={sectionId}
                        onBlur={() => setShowCreateNewSubtask(false)}
                    />
                )}
                {subtasks.map((subtask) => {
                    return <Subtask key={subtask.id} title={subtask.title} />
                })}
            </TaskListContainer>
        </div>
    )
}

export default SubtaskList
