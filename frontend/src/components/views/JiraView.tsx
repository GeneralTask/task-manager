import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flex } from '@mantine/core'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasksV4 } from '../../services/api/tasksv4.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import { doesAccountNeedRelinking, isJiraLinked } from '../../utils/utils'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { Header } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const BodyHeader = styled.div`
    ${Typography.body};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`

const JiraView = () => {
    const { data: tasks } = useGetTasksV4()
    const { jiraTaskId } = useParams()
    const navigate = useNavigate()
    const { calendarType } = useCalendarContext()

    const jiraTasks = useMemo(() => {
        return tasks?.filter((task) => !task.is_done && !task.is_deleted && task.source.name === 'Jira') ?? []
    }, [tasks])

    const selectTask = useCallback((task: TTaskV4) => {
        navigate(`/jira/${task.id}`)
        Log(`linear_task_select__/linear/${task.id}`)
    }, [])
    useItemSelectionController(jiraTasks, selectTask)

    const { task } = useMemo(() => {
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
                    <Header folderName="Jira tasks" />
                    {doesNeedRelinking && <ConnectIntegration type="jira" reconnect />}
                    {isJiraIntegrationLinked ? (
                        <>
                            <BodyHeader>All tasks assigned to you.</BodyHeader>
                            {jiraTasks?.map((task) => (
                                <div key={task.id}>{task.title}</div>
                                // <Task key={task.id} task={task} />
                            ))}
                        </>
                    ) : (
                        <ConnectIntegration type="jira" />
                    )}
                </ScrollableListTemplate>
            </Flex>
            {calendarType === 'day' && (
                <>
                    {task ? (
                        <TaskDetails task={task} />
                    ) : (
                        <EmptyDetails icon={icons.check} text="You have no Jira tasks" />
                    )}
                </>
            )}
        </>
    )
}

export default JiraView
