import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import useGetActiveTasks from '../../hooks/useGetActiveTasks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskV4 } from '../../utils/types'
import { doesAccountNeedRelinking, isLinearLinked } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { useCalendarContext } from '../calendar/CalendarContext'
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
    const { data: activeTasks } = useGetActiveTasks()
    const { linearIssueId } = useParams()
    const navigate = useNavigate()
    const { calendarType } = useCalendarContext()

    const linearTasks = useMemo(() => activeTasks?.filter((task) => task.source.name === 'Linear') || [], [activeTasks])

    const selectTask = useCallback((task: TTaskV4) => {
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
    }, [activeTasks, linearIssueId])

    useEffect(() => {
        if (task) navigate(`/linear/${task.id}`)
    }, [activeTasks, task])

    const { data: linkedAccounts } = useGetLinkedAccounts()
    const isLinearIntegrationLinked = isLinearLinked(linkedAccounts || [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'Linear')

    return (
        <>
            <Flex>
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
            </Flex>
            {calendarType === 'day' && (
                <>
                    {task ? (
                        <TaskDetails task={task} />
                    ) : (
                        <EmptyDetails icon={icons.check} text="You have no Linear tasks" />
                    )}
                </>
            )}
        </>
    )
}

export default LinearView
