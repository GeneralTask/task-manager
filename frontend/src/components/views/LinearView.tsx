import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController, usePreviewMode } from '../../hooks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { useGetTasksV4 } from '../../services/api/tasksv4.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskUnion } from '../../utils/types'
import { doesAccountNeedRelinking, isLinearLinked } from '../../utils/utils'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import LinearTask from '../molecules/LinearTask'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const LinearBodyHeader = styled.div`
    ${Typography.body};
    color: ${Colors.text.light};
    margin: ${Spacing._16} 0;
`

const LinearView = () => {
    const { isPreviewMode } = usePreviewMode()
    const { data: taskSections } = useGetTasks()
    const { data: tasks } = useGetTasksV4()
    const { linearIssueId } = useParams()
    const navigate = useNavigate()

    const linearTasks = useMemo((): TTaskUnion[] => {
        if (isPreviewMode) {
            return tasks?.filter((task) => !task.is_done && !task.is_deleted && task.source.name === 'Linear') || []
        } else {
            const filteredTasks =
                taskSections
                    ?.filter((section) => !section.is_done && !section.is_trash)
                    .flatMap((section) => section.tasks) ?? []
            return filteredTasks.filter((task) => task.source.name === 'Linear')
        }
    }, [taskSections, isPreviewMode])

    const selectTask = useCallback((task: TTaskUnion) => {
        navigate(`/linear/${task.id}`)
        Log(`linear_task_select__/linear/${task.id}`)
    }, [])
    useItemSelectionController(linearTasks, selectTask)

    const { task } = useMemo(() => {
        if (linearTasks.length === 0) return { task: null }
        for (const task of linearTasks) {
            if (task.id === linearIssueId) return { task }
        }
        return { task: linearTasks[0] }
    }, [taskSections, linearIssueId])

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isLinearIntegrationLinked = isLinearLinked(linkedAccounts || [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'Linear')

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Linear Issues" />
                {doesNeedRelinking && <ConnectIntegration type="linear" reconnect />}
                {isLinearIntegrationLinked ? (
                    <>
                        <LinearBodyHeader>All issues assigned to you.</LinearBodyHeader>
                        {linearTasks?.map((task) => (
                            <LinearTask key={task.id} task={task} />
                        ))}
                    </>
                ) : (
                    <ConnectIntegration type="linear" />
                )}
            </ScrollableListTemplate>
            {task ? (
                <TaskDetails task={task} link={`/linear/${task.id}`} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no Linear tasks" />
            )}
        </>
    )
}

export default LinearView
