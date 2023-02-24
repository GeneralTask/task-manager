import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import { useKeyboardShortcut } from '../../../hooks'
import { useCreateTask, useReorderTask } from '../../../services/api/tasks.hooks'
import { useGetTasksV4 } from '../../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { DropItem, DropType, TParentTask, TSubtask } from '../../../utils/types'
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
    parentTask: TParentTask
}

const SubtaskList = ({ parentTask }: SubtasksProps) => {
    const { data: allTasks } = useGetTasksV4()
    const { mutate: createTask } = useCreateTask()
    const { mutate: reorderMutate } = useReorderTask()
    const [showCreateNewSubtask, setShowCreateNewSubtask] = useState(false)
    useKeyboardShortcut(
        'createSubtask',
        useCallback(() => setShowCreateNewSubtask(true), [])
    )

    const handleReorder = useCallback(
        (item: DropItem, dropIndex: number) => {
            if (!parentTask.id_folder) return
            reorderMutate({
                id: item.id,
                parentId: parentTask.id,
                isSubtask: true,
                orderingId: dropIndex,
                dropSectionId: parentTask.id_folder,
            })
        },
        [parentTask.id_folder, parentTask.id]
    )

    const subtasks = allTasks?.filter((task): task is TSubtask => task.id_parent === parentTask.id) ?? []
    subtasks.sort((a, b) => a.id_ordering - b.id_ordering)

    return (
        <Flex flex="1" column>
            <TaskListContainer>
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
                        onSubmit={(title) =>
                            createTask({
                                title: title,
                                id_parent: parentTask.id,
                                optimisticId: uuidv4(),
                            })
                        }
                        onBlur={() => setShowCreateNewSubtask(false)}
                        autoFocus
                    />
                )}
                {subtasks.map((subtask, index) => (
                    <ReorderDropContainer
                        key={subtask.id}
                        index={index}
                        acceptDropType={DropType.SUBTASK}
                        onReorder={handleReorder}
                        disabled={false}
                    >
                        <Subtask key={subtask.id} subtask={subtask} />
                    </ReorderDropContainer>
                ))}
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
