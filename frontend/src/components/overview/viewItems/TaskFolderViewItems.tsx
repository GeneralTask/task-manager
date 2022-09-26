import { Ref, forwardRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useReorderTask } from '../../../services/api/tasks.hooks'
import { DropItem, DropType, TTask } from '../../../utils/types'
import ReorderDropContainer from '../../atoms/ReorderDropContainer'
import CreateNewTask from '../../molecules/CreateNewTask'
import Task from '../../molecules/Task'
import { ViewHeader, ViewName } from '../styles'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const TaskFolderViewItems = forwardRef(
    ({ view, visibleItemsCount, scrollRef }: ViewItemsProps, ref: Ref<HTMLDivElement>) => {
        const { task_folder_id: folderId } = view
        const { overviewViewId, overviewItemId } = useParams()
        const { mutate: reorderTask } = useReorderTask()

        const handleReorderTask = useCallback(
            (item: DropItem, dropIndex: number) => {
                if (!view.task_folder_id) return
                reorderTask({
                    taskId: item.id,
                    orderingId: dropIndex,
                    dropFolderId: view.task_folder_id,
                    dragFolderId: item.folderId,
                })
            },
            [view.task_folder_id]
        )

        return (
            <>
                <ViewHeader ref={ref}>
                    <ViewName>{view.name}</ViewName>
                </ViewHeader>
                {folderId && <CreateNewTask disableTooltip folderId={folderId} />}
                {view.view_items.length > 0 ? (
                    view.view_items.slice(0, visibleItemsCount).map((item, index) => (
                        <ReorderDropContainer
                            key={item.id}
                            index={index}
                            acceptDropType={DropType.TASK}
                            onReorder={handleReorderTask}
                        >
                            <Task
                                task={item as TTask}
                                dragDisabled={false}
                                index={index}
                                folderId={folderId}
                                folderScrollingRef={scrollRef}
                                isSelected={overviewViewId === view.id && overviewItemId === item.id}
                                link={`/overview/${view.id}/${item.id}`}
                            />
                        </ReorderDropContainer>
                    ))
                ) : (
                    <ReorderDropContainer
                        index={0}
                        acceptDropType={DropType.TASK}
                        onReorder={handleReorderTask}
                        indicatorType="WHOLE"
                    >
                        <EmptyViewItem
                            header="You've completed all your tasks!"
                            body="Create new tasks to see them here."
                        />
                    </ReorderDropContainer>
                )}
            </>
        )
    }
)

export default TaskFolderViewItems
