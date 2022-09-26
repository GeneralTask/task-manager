import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import SelectableContainer from '../atoms/SelectableContainer'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import { Header } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const LinearSelectableContainer = styled(SelectableContainer)`
    display: flex;
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

const LinearView = () => {
    const { data: taskFolders } = useGetTasks()
    const { linearIssueId } = useParams()
    const navigate = useNavigate()

    const onClick = (id: string) => {
        navigate(`/linear/${id}`)
    }

    const linearTasks = useMemo(() => {
        const tasks = taskFolders?.flatMap((folder) => folder.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Linear')
    }, [taskFolders])

    const { task } = useMemo(() => {
        if (linearTasks.length === 0) return { task: null }
        for (const task of linearTasks) {
            if (task.id === linearIssueId) return { task }
        }
        return { task: linearTasks[0] }
    }, [taskFolders, linearIssueId])

    return (
        <>
            <ScrollableListTemplate>
                <Header name="Linear Issues" />
                <LinearBodyHeader>All issues assigned to you.</LinearBodyHeader>
                {linearTasks?.map((task) => (
                    <LinearSelectableContainer
                        key={task.id}
                        onClick={() => onClick(task.id)}
                        isSelected={linearIssueId === task.id}
                    >
                        <LinearTitle>{task.title}</LinearTitle>
                    </LinearSelectableContainer>
                ))}
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
