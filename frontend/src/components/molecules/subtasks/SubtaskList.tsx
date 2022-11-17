import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useGetTasks, useReorderTask } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { DropItem, DropType, TTask } from '../../../utils/types'
import { getSectionFromTask } from '../../../utils/utils'
import { Icon } from '../../atoms/Icon'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
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
`

interface SubtasksProps {
    taskId: string
    subtasks: TTask[]
}

const SubtaskList = ({ taskId, subtasks }: SubtasksProps) => {
    const { data: taskSections } = useGetTasks()
    const sectionId = getSectionFromTask(taskSections ?? [], taskId)?.id
    const [showCreateNewSubtask, setShowCreateNewSubtask] = useState(false)
    const { mutate: reorderMutate } = useReorderTask()

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!sectionId) return
            reorderMutate({
                id: item.id,
                parentId: taskId,
                isSubtask: true,
                orderingId: dropIndex,
                dropSectionId: sectionId,
            })
        },
        [sectionId, taskId]
    )

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
                {subtasks.map((subtask, index) => {
                    return (
                        <ReorderDropContainer
                            key={subtask.id}
                            index={index}
                            acceptDropType={DropType.SUBTASK}
                            onReorder={handleReorder}
                            disabled={false}
                        >
                            <Subtask key={subtask.id} parentTaskId={taskId} subtask={subtask} />
                        </ReorderDropContainer>
                    )
                })}
            </TaskListContainer>
        </div>
    )
}

export default SubtaskList
