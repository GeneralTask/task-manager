import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useItemSelectionController } from '../../hooks'
import Log from '../../services/api/log'
import { useGetLinkedAccounts } from '../../services/api/settings.hooks'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTask } from '../../utils/types'
import { doesAccountNeedRelinking, isSlackLinked } from '../../utils/utils'
import SelectableContainer, { PurpleEdge } from '../atoms/SelectableContainer'
import TaskTemplate from '../atoms/TaskTemplate'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import ConnectIntegration from '../molecules/ConnectIntegration'
import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const SlackTemplateContainer = styled(TaskTemplate)`
    height: fit-content;
`

const SlackSelectableContainer = styled(SelectableContainer)`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._16} ${Spacing._24};
    margin-bottom: ${Spacing._4};
    ${Typography.bodySmall};
`
const LinearBodyHeader = styled.div`
    ${Typography.body};
    color: ${Colors.text.light};
    margin-bottom: ${Spacing._16};
`
const LinearTitle = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`
const ExternalLinkContainer = styled.div`
    margin-left: auto;
`

const SlackTasksView = () => {
    const { data: taskSections } = useGetTasks()
    const { slackTaskId } = useParams()
    const navigate = useNavigate()

    const slackTasks = useMemo(() => {
        const tasks = taskSections?.flatMap((section) => section.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Slack' && (!task.is_done || task.isOptimistic))
    }, [taskSections])

    const { data: linkedAccounts } = useGetLinkedAccounts()

    const isSlackIntegrationLinked = isSlackLinked(linkedAccounts || [])
    const doesNeedRelinking = doesAccountNeedRelinking(linkedAccounts || [], 'Slack')

    const { task } = useMemo(() => {
        if (slackTasks.length === 0) return { task: null }
        for (const task of slackTasks) {
            if (task.id === slackTaskId) return { task }
        }
        return { task: slackTasks[0] }
    }, [taskSections, slackTaskId])

    useEffect(() => {
        if (task) navigate(`/slack/${task.id}`)
    }, [])

    const onClick = (id: string) => {
        navigate(`/slack/${id}`)
        Log(`slack_task_select__/slack/${id}`)
    }

    const selectTask = useCallback((task: TTask) => {
        navigate(`/slack/${task.id}`)
        Log(`slack_task_select__/slack/${task.id}`)
    }, [])
    useItemSelectionController(slackTasks, selectTask)

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Slack Messages" />
                {doesNeedRelinking && <ConnectIntegration type="slack" reconnect />}
                {isSlackIntegrationLinked ? (
                    <>
                        <LinearBodyHeader>All messages you&apos;ve created tasks for</LinearBodyHeader>
                        {slackTasks?.map((task) => (
                            <SlackTemplateContainer key={task.id}>
                                <SlackSelectableContainer
                                    isSelected={task.id === slackTaskId}
                                    key={task.id}
                                    onClick={() => onClick(task.id)}
                                >
                                    {slackTaskId === task.id && <PurpleEdge />}
                                    <MarkTaskDoneButton
                                        isDone={task.is_done}
                                        taskId={task.id}
                                        isSelected={true}
                                        isDisabled={task.isOptimistic}
                                    />
                                    <LinearTitle>{task.title}</LinearTitle>
                                    <ExternalLinkContainer>
                                        <ExternalLinkButton link={task.deeplink} />
                                    </ExternalLinkContainer>
                                </SlackSelectableContainer>
                            </SlackTemplateContainer>
                        ))}
                    </>
                ) : (
                    <ConnectIntegration type="slack" />
                )}
            </ScrollableListTemplate>
            {task ? (
                <TaskDetails task={task} link={`/slack/${task.id}`} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no Slack tasks" />
            )}
        </>
    )
}

export default SlackTasksView
