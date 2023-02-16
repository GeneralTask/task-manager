import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasksV4 } from '../../services/api/tasksv4.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import { doesAccountNeedRelinking, isSlackLinked } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { useCalendarContext } from '../calendar/CalendarContext'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import SlackTask from '../molecules/SlackTask'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const BodyHeader = styled.div`
    ${Typography.body};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`

const SlackTasksView = () => {
    const { data: allTasks } = useGetTasksV4()
    const { slackTaskId } = useParams()
    const navigate = useNavigate()
    const { calendarType, setCalendarType, setDate, dayViewDate } = useCalendarContext()

    const slackTasks = useMemo(
        () => allTasks?.filter((task) => task.source.name === 'Slack' && !task.is_done && !task.is_deleted) || [],
        [allTasks]
    )

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const isSlackIntegrationLinked = isSlackLinked(linkedAccounts || [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'Slack')

    const { task } = useMemo(() => {
        if (slackTasks.length === 0) return { task: null }
        for (const task of slackTasks) {
            if (task.id === slackTaskId) return { task }
        }
        return { task: slackTasks[0] }
    }, [allTasks, slackTaskId])

    useEffect(() => {
        if (task) navigate(`/slack/${task.id}`)
    }, [])

    const onClick = (id: string) => {
        if (calendarType === 'week' && slackTaskId === id) {
            setCalendarType('day')
            setDate(dayViewDate)
        }
        navigate(`/slack/${id}`)
        Log(`slack_task_select__/slack/${id}`)
    }

    const selectTask = useCallback((task: TTaskV4) => {
        navigate(`/slack/${task.id}`)
        Log(`slack_task_select__/slack/${task.id}`)
    }, [])
    useItemSelectionController(slackTasks, selectTask)

    return (
        <>
            <Flex>
                <ScrollableListTemplate>
                    <SectionHeader sectionName="Slack Messages" />
                    {doesNeedRelinking && <ConnectIntegration type="slack" reconnect />}
                    {isSlackIntegrationLinked ? (
                        <>
                            <BodyHeader>All messages you&apos;ve created tasks for</BodyHeader>
                            {slackTasks?.map((task) => (
                                <SlackTask
                                    key={task.id}
                                    task={task}
                                    isSelected={task.id === slackTaskId}
                                    onClick={onClick}
                                />
                            ))}
                        </>
                    ) : (
                        <ConnectIntegration type="slack" />
                    )}
                </ScrollableListTemplate>
            </Flex>
            {calendarType === 'day' && (
                <>
                    {task ? (
                        <TaskDetails task={task} />
                    ) : (
                        <EmptyDetails icon={icons.check} text="You have no Slack tasks" />
                    )}
                </>
            )}
        </>
    )
}

export default SlackTasksView
