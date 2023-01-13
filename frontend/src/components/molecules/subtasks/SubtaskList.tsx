import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { useKeyboardShortcut } from '../../../hooks'
import { useCreateTask, useGetTasks, useReorderTask } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { DropItem, DropType, TTask } from '../../../utils/types'
import { getSectionFromTask } from '../../../utils/utils'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import Tip from '../../radix/Tip'
import CreateNewItemInput from '../CreateNewItemInput'
import Subtask from './Subtask'

const AddTaskbutton = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    color: ${Colors.text.light};
    ${Typography.label};
    cursor: pointer;
    user-select: none;
    padding: ${Spacing._8};
    height: ${Spacing._32};
    width: fit-content;
    border: ${Border.stroke.small} solid transparent;
    box-sizing: border-box;
    :hover {
        border-color: ${Colors.border.light};
        border-radius: ${Border.radius.small};
    }
`
const MarginBottomDiv = styled.div`
    margin-bottom: ${Spacing._24};
`
const TaskListContainer = styled.div`
    display: flex;
    flex-direction: column;
`

interface SubtasksProps {
    parentTask: TTask
    subtasks: TTask[]
}

const SubtaskList = ({ parentTask, subtasks }: SubtasksProps) => {
    const { data: taskSections } = useGetTasks()
    const sectionId = getSectionFromTask(taskSections ?? [], parentTask.id)?.id
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderMutate } = useReorderTask()
    const [showCreateNewSubtask, setShowCreateNewSubtask] = useState(false)
    useKeyboardShortcut(
        'createSubtask',
        useCallback(() => setShowCreateNewSubtask(true), [])
    )

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!sectionId) return
            reorderMutate({
                id: item.id,
                parentId: parentTask.id,
                isSubtask: true,
                orderingId: dropIndex,
                dropSectionId: sectionId,
            })
        },
        [sectionId, parentTask.id]
    )

    if (!sectionId) return null
    return (
        <Flex flex="1" column>
            <TaskListContainer>
                {sectionId && (
                    <>
                        {!showCreateNewSubtask && (
                            <MarginBottomDiv>
                                <Tip shortcutName="createSubtask" content="Create new subtask" fitContent>
                                    <AddTaskbutton onClick={() => setShowCreateNewSubtask(true)}>
                                        <Icon icon={icons.plus} color="gray" />
                                        Add new subtask
                                    </AddTaskbutton>
                                </Tip>
                            </MarginBottomDiv>
                        )}
                        {showCreateNewSubtask && (
                            <CreateNewItemInput
                                placeholder="Add new subtask"
                                onSubmit={(title) => {
                                    createTask({
                                        title: title,
                                        parent_task_id: parentTask.id,
                                        taskSectionId: sectionId,
                                        optimisticId: uuidv4(),
                                    })
                                }}
                                onSubmitShift={(title) => {
                                    const optimisticId = uuidv4()
                                    createTask({
                                        title: title,
                                        parent_task_id: parentTask.id,
                                        taskSectionId: sectionId,
                                        optimisticId,
                                    })
                                    reorderMutate(
                                        {
                                            id: optimisticId,
                                            parentId: parentTask.id,
                                            isSubtask: true,
                                            orderingId: parentTask.sub_tasks?.length ?? 0,
                                            dropSectionId: sectionId,
                                        },
                                        optimisticId
                                    )
                                }}
                                onBlur={() => setShowCreateNewSubtask(false)}
                                autoFocus
                            />
                        )}
                    </>
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
                            <Subtask key={subtask.id} parentTask={parentTask} subtask={subtask} />
                        </ReorderDropContainer>
                    )
                })}
            </TaskListContainer>
            <ReorderDropContainer
                index={subtasks.length + 1}
                acceptDropType={DropType.SUBTASK}
                onReorder={handleReorder}
                indicatorType="TOP_ONLY"
                disabled={false}
            />
        </Flex>
    )
}

export default SubtaskList
