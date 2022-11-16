import { useState } from 'react'
import styled from 'styled-components'
import { useGetTasks } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { TTask } from '../../../utils/types'
import { getSectionFromTask } from '../../../utils/utils'
import { Icon } from '../../atoms/Icon'
import CreateNewSubtask from './CreateNewSubtask'
import Subtask from './Subtask'

const AddTaskbutton = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    color: ${Colors.text.light};
    ${Typography.mini};
    cursor: pointer;
    user-select: none;
    padding: ${Spacing._8};
    height: fit-content;
    width: fit-content;
    border: ${Border.stroke.small} solid transparent;
    :hover {
        border-color: ${Colors.border.light};
        border-radius: ${Border.radius.small};
    }
    margin-bottom: ${Spacing._16};
`
const TaskListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
`

interface SubtasksProps {
    taskId: string
    subtasks: TTask[]
}

const SubtaskList = ({ taskId, subtasks }: SubtasksProps) => {
    const { data: taskSections } = useGetTasks()
    const sectionId = getSectionFromTask(taskSections ?? [], taskId)?.id
    const [showCreateNewSubtask, setShowCreateNewSubtask] = useState(false)

    if (!sectionId) return null
    return (
        <div>
            <AddTaskbutton onClick={() => setShowCreateNewSubtask(true)}>
                <Icon icon={icons.plus} color="gray" />
                Add new subtask
            </AddTaskbutton>
            <TaskListContainer>
                {showCreateNewSubtask && sectionId && (
                    <CreateNewSubtask
                        parentTaskId={taskId}
                        sectionId={sectionId}
                        hideCreateNewSubtask={() => setShowCreateNewSubtask(false)}
                    />
                )}
                {subtasks.map((subtask) => {
                    return <Subtask key={subtask.id} parentTaskId={taskId} subtask={subtask} />
                })}
            </TaskListContainer>
        </div>
    )
}

export default SubtaskList
