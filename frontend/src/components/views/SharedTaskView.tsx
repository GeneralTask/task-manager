import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import { useGetSharedTask } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TSubtask } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import MarkdownRenderer from '../atoms/MarkdownRenderer'
import Spinner from '../atoms/Spinner'
import { Truncated } from '../atoms/typography/Typography'
import GTDatePickerButton from '../molecules/GTDatePickerButton'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import ContentContainer from '../molecules/shared_item_page/ContentContainer'
import NotAvailableMessage from '../molecules/shared_item_page/NotAvailableMessage'
import SharedItemBodyContainer from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'
import SubtaskBody from '../molecules/subtasks/SubtaskBody'
import PriorityDropdownTrigger from '../radix/PriorityDropdownTrigger'
import EmptyBody from '../shared_task/EmptyBody'
import StatusBadge from '../shared_task/StatusBadge'

const PARENT_TASK_TITLE_MAX_WIDTH = '200px'
const getSharedWithMessage = (domain: string | undefined, sharedAccess: string | undefined) => {
    if (!domain || !sharedAccess) return ''
    if (sharedAccess === 'domain') {
        return `Shared with everyone ${domain}`
    }
    return 'Shared with everyone'
}

const ReturnToParentTaskContainer = styled.div`
    ${Typography.label.small};
    color: ${Colors.text.muted};
    display: flex;
    cursor: pointer;
    gap: ${Spacing._8};
    user-select: none;
    max-width: ${PARENT_TASK_TITLE_MAX_WIDTH};
`
const SharedWithText = styled.div`
    ${Typography.label.small};
    color: ${Colors.text.muted};
    display: flex;
    align-items: center;
    justify-content: flex-end;
`
const TitleContainer = styled.div`
    margin-bottom: ${Spacing._12};
    display: flex;
    justify-content: space-between;
`
const TaskFieldContainer = styled.div`
    display: flex;
    margin-bottom: ${Spacing._12};
`
const SubtaskContainer = styled.div`
    margin-top: ${Spacing._24};
    display: flex;
    flex-direction: column;
    gap: ${Spacing._12};
    color: ${Colors.text.base};
    ${Typography.label.small};
    padding: ${Spacing._8};
`
const SubtaskList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._4};
`
const SharedTask = () => {
    const { isPreviewMode, isLoading: isPreviewModeLoading } = usePreviewMode()
    const { taskId } = useParams()

    const { data, isLoading } = useGetSharedTask({ id: taskId ?? '' })
    const { task } = data ?? {}
    const subtasks = data?.subtasks.sort((a, b) => a.id_ordering - b.id_ordering) ?? []

    const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null)
    const selectedSubtask = subtasks.find((subtask) => subtask.id === selectedSubtaskId)
    const displayedTask = selectedSubtask ?? task
    const taskStatus = task?.is_done ? 'complete' : 'in-progress'

    const returnToParentTask = () => {
        setSelectedSubtaskId(null)
    }

    if (!isPreviewMode && !isPreviewModeLoading) {
        return <Navigate to="/" replace />
    }
    if (isLoading) {
        return <Spinner />
    }
    return (
        <BackgroundContainer>
            <ContentContainer>
                <SharedItemHeader sharedType="Tasks" />
                <SharedItemBodyContainer
                    content={
                        displayedTask ? (
                            <>
                                {selectedSubtaskId != null && (
                                    <ReturnToParentTaskContainer onClick={returnToParentTask}>
                                        <Icon icon={icons.caret_left} color="gray" />
                                        <Truncated>Return to {task?.title}</Truncated>
                                    </ReturnToParentTaskContainer>
                                )}
                                <TitleContainer>
                                    <GTTextField
                                        type="plaintext"
                                        value={displayedTask?.title ?? ''}
                                        onChange={emptyFunction}
                                        fontSize="large"
                                        disabled
                                        readOnly
                                    />
                                    <StatusBadge status={taskStatus} />
                                </TitleContainer>
                                <TaskFieldContainer>
                                    <PriorityDropdownTrigger value={displayedTask?.priority_normalized ?? 0} />
                                    <GTDatePickerButton currentDate={DateTime.fromISO(displayedTask?.due_date ?? '')} />
                                </TaskFieldContainer>
                                {displayedTask?.body.trim() ? (
                                    <MarkdownRenderer>{displayedTask?.body}</MarkdownRenderer>
                                ) : (
                                    <EmptyBody />
                                )}
                                {selectedSubtaskId == null && subtasks.length > 0 && (
                                    <SubtaskContainer>
                                        Subtasks
                                        <SubtaskList>
                                            {subtasks.map((subtask) => (
                                                <SubtaskBody
                                                    key={subtask.id}
                                                    subtask={subtask as TSubtask}
                                                    onClick={() => setSelectedSubtaskId(subtask.id)}
                                                />
                                            ))}
                                        </SubtaskList>
                                    </SubtaskContainer>
                                )}
                            </>
                        ) : (
                            <NotAvailableMessage sharedType="Tasks" />
                        )
                    }
                    footer={
                        task && (
                            <SharedWithText>
                                {getSharedWithMessage(data?.domain, data?.task.shared_access)}
                            </SharedWithText>
                        )
                    }
                />
            </ContentContainer>
        </BackgroundContainer>
    )
}

export default SharedTask
