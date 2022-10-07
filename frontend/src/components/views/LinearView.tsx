import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { isLinearLinked } from '../../utils/utils'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import LinearTask from '../molecules/LinearTask'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const LinearBodyHeader = styled.div`
    ${Typography.body};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`

const LinearView = () => {
    const { data: taskSections } = useGetTasks()
    const { linearIssueId } = useParams()
    const navigate = useNavigate()

    const linearTasks = useMemo(() => {
        const tasks =
            taskSections
                ?.filter((section) => !section.is_done && !section.is_trash)
                .flatMap((section) => section.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Linear')
    }, [taskSections])

    useItemSelectionController(
        linearTasks,
        useCallback((itemId: string) => navigate(`/linear/${itemId}`), [])
    )

    const { task } = useMemo(() => {
        if (linearTasks.length === 0) return { task: null }
        for (const task of linearTasks) {
            if (task.id === linearIssueId) return { task }
        }
        return { task: linearTasks[0] }
    }, [taskSections, linearIssueId])

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isLinearIntegrationLinked = isLinearLinked(linkedAccounts || [])

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Linear Issues" />
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
