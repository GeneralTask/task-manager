import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flex } from '@mantine/core'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import { doesAccountNeedRelinking, isJiraLinked } from '../../utils/utils'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { Header } from '../molecules/Header'
import Task from '../molecules/Task'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const BodyHeader = styled.div`
    ${Typography.body};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`

const JiraView = () => {
    const { data: tasks } = useGetActiveTasks()
    const { jiraTaskId } = useParams()
    const navigate = useNavigate()
    const { calendarType } = useCalendarContext()

    const jiraTasks = useMemo(() => {
        return (
            tasks
                ?.filter((task) => !task.is_done && !task.is_deleted && task.source.name === 'Jira')
                .sort((a, b) => (a.priority_normalized > b.priority_normalized ? 1 : -1)) ?? []
        )
    }, [tasks])

    const selectTask = useCallback((task: TTaskV4) => {
        navigate(`/jira/${task.id}`)
        Log(`jira_task_select__/jira/${task.id}`)
    }, [])
    useItemSelectionController(jiraTasks, selectTask)

    const { task: selectedTask } = useMemo(() => {
        if (jiraTasks.length === 0) return { task: null }
        for (const task of jiraTasks) {
            if (task.id === jiraTaskId) return { task }
        }
        return { task: jiraTasks[0] }
    }, [jiraTasks, jiraTaskId])

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isJiraIntegrationLinked = isJiraLinked(linkedAccounts || [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'Jira')

    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <Header folderName="Jira issues" />
                    {doesNeedRelinking && <ConnectIntegration type="jira" reconnect />}
                    {isJiraIntegrationLinked ? (
                        <>
                            <BodyHeader>All issues assigned to you.</BodyHeader>
                            {jiraTasks?.map((task) => (
                                <Task
                                    key={task.id}
                                    task={task}
                                    isSelected={task.id === selectedTask?.id}
                                    link={`/jira/${task.id}`}
                                />
                            ))}
                        </>
                    ) : (
                        <ConnectIntegration type="jira" />
                    )}
                </ScrollableListTemplate>
            </Flex>
            {calendarType === 'day' && (
                <>
                    {selectedTask ? (
                        <TaskDetails task={selectedTask} />
                    ) : (
                        <EmptyDetails icon={icons.check} text="You have no Jira issues" />
                    )}
                </>
            )}
        </>
    )
}

export default JiraView
