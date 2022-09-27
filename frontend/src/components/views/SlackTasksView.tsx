import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import SelectableContainer from '../atoms/SelectableContainer'
import TaskTemplate from '../atoms/TaskTemplate'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import MarkTaskDoneButton from '../atoms/buttons/MarkTaskDoneButton'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

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
    }

    const [isVisible, setIsVisible] = useState(true)

    const taskFadeOut = () => {
        if (!task) return
        setIsVisible(task.is_done)
    }

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Slack Messages" />
                <LinearBodyHeader>All messages you&apos;ve created tasks for</LinearBodyHeader>
                {slackTasks?.map((task) => (
                    <TaskTemplate key={task.id} isVisible={isVisible}>
                        <SlackSelectableContainer
                            isSelected={task.id === slackTaskId}
                            key={task.id}
                            onClick={() => onClick(task.id)}
                        >
                            <MarkTaskDoneButton
                                isDone={task.is_done}
                                taskId={task.id}
                                isSelected={true}
                                isDisabled={task.isOptimistic}
                                onMarkComplete={taskFadeOut}
                            />
                            <LinearTitle>
                                From {task.sender} @{' '}
                                {DateTime.fromISO(task.sent_at).toLocaleString(DateTime.TIME_SIMPLE)}
                            </LinearTitle>
                            <ExternalLinkContainer>
                                <ExternalLinkButton link={task.deeplink} />
                            </ExternalLinkContainer>
                        </SlackSelectableContainer>
                    </TaskTemplate>
                ))}
            </ScrollableListTemplate>
            {task ? (
                <TaskDetails task={task} link={`/slack/${task.id}`} />
            ) : (
                <EmptyDetails icon={icons.check} text="You have no tasks" />
            )}
        </>
    )
}

export default SlackTasksView
