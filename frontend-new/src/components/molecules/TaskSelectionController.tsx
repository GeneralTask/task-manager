import { useCallback } from 'react'
import { TTaskSection } from '../../utils/types'
import { useKeyboardShortcut } from '../atoms/KeyboardShortcuts'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setSelectedTaskId } from '../../redux/tasksPageSlice'

interface KeyboardSelectorProps {
    taskSection: TTaskSection
}
export default function TaskSelectionController({ taskSection }: KeyboardSelectorProps) {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const expandedTask = useParams().task
    // if there is no expanded task, then get the selected task from redux
    const selectedTaskId = useAppSelector((state) => expandedTask ?? state.tasks_page.selected_task_id)

    // on press DOWN -> select first task ahh
    const onUpDown = useCallback(
        (direction: 'up' | 'down') => {
            let newSelectedTask = ''
            // if a task is not selected, select the first one
            if (selectedTaskId == null && taskSection.tasks.length > 0) {
                newSelectedTask = taskSection.tasks[0].id
            } else {
                const index = taskSection.tasks.findIndex((task) => task.id === selectedTaskId)
                // if for some reason the task is not found, select the first one
                if (index === -1) {
                    newSelectedTask = taskSection.tasks[0].id
                } else if (direction === 'up' && index > 0) {
                    newSelectedTask = taskSection.tasks[index - 1].id
                } else if (direction === 'down' && index < taskSection.tasks.length - 1) {
                    newSelectedTask = taskSection.tasks[index + 1].id
                }
            }
            if (newSelectedTask) {
                if (expandedTask) {
                    navigate(`/tasks/${taskSection.id}/${newSelectedTask}`)
                } else {
                    // select task in redux
                    dispatch(setSelectedTaskId(newSelectedTask))
                }
            }
        },
        [selectedTaskId, taskSection]
    )

    useKeyboardShortcut('ArrowDown', () => onUpDown('down'))
    useKeyboardShortcut('ArrowUp', () => onUpDown('up'))

    return <></>
}
