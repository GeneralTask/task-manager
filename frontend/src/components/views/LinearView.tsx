import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { linearStatus } from '../../styles/images'
import { icons } from '../../styles/images'
import CommentCount from '../atoms/CommentCount'
import { Icon } from '../atoms/Icon'
import SelectableContainer from '../atoms/SelectableContainer'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import EmptyDetails from '../details/EmptyDetails'
import TaskDetails from '../details/TaskDetails'
import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const LinearSelectableContainer = styled(SelectableContainer)`
    display: flex;
    padding: ${Spacing._16} ${Spacing._24};
    margin-bottom: ${Spacing._4};
    align-items: center;
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
const LeftContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    min-width: 0;
    margin-right: ${Spacing._16};
`
const RightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._24};
    margin-left: auto;
`

const LinearView = () => {
    const { data: taskSections } = useGetTasks()
    const { linearIssueId } = useParams()
    const navigate = useNavigate()

    const onClick = (id: string) => {
        navigate(`/linear/${id}`)
    }

    const linearTasks = useMemo(() => {
        const tasks = taskSections?.flatMap((section) => section.tasks) ?? []
        return tasks.filter((task) => task.source.name === 'Linear')
    }, [taskSections])

    const { task } = useMemo(() => {
        if (linearTasks.length === 0) return { task: null }
        for (const task of linearTasks) {
            if (task.id === linearIssueId) return { task }
        }
        return { task: linearTasks[0] }
    }, [taskSections, linearIssueId])

    return (
        <>
            <ScrollableListTemplate>
                <SectionHeader sectionName="Linear Issues" />
                <LinearBodyHeader>All issues assigned to you.</LinearBodyHeader>
                {linearTasks?.map((task) => (
                    <LinearSelectableContainer
                        key={task.id}
                        onClick={() => onClick(task.id)}
                        isSelected={linearIssueId === task.id}
                    >
                        <LeftContainer>
                            {task.external_status && (
                                <Icon icon={linearStatus[task.external_status?.type]} size="small" />
                            )}
                            <LinearTitle>{task.title}</LinearTitle>
                        </LeftContainer>
                        <RightContainer>
                            {task.comments && task.comments.length > 0 && <CommentCount count={task.comments.length} />}
                            <ExternalLinkButton link={task.deeplink} />
                        </RightContainer>
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
