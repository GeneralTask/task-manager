import { Navigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import { useGetSharedTask } from '../../services/api/tasks.hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { TSubtask } from '../../utils/types'
import { emptyFunction } from '../../utils/utils'
import GTTextField from '../atoms/GTTextField'
import Spinner from '../atoms/Spinner'
import GTDatePickerButton from '../molecules/GTDatePickerButton'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import ContentContainer from '../molecules/shared_item_page/ContentContainer'
import SharedItemBodyContainer from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'
import SubtaskBody from '../molecules/subtasks/SubtaskBody'

const getSharedWithMessage = (domain: string | undefined, sharedAccess: string | undefined) => {
    if (!domain || !sharedAccess) return ''
    if (sharedAccess === 'domain') {
        return `Shared with everyone ${domain}`
    }
    return 'Shared with everyone'
}

const SharedWithText = styled.div`
    ${Typography.body.small};
    color: ${Colors.text.muted};
    display: flex;
    align-items: center;
    justify-content: flex-end;
`
const TitleContainer = styled.div`
    margin-bottom: ${Spacing._12};
`
const TaskFieldContainer = styled.div`
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

    if (!isPreviewMode && !isPreviewModeLoading) {
        return <Navigate to="/" replace />
    }
    if (isLoading) {
        return <Spinner />
    }
    if (!task && !isLoading) {
        return <Navigate to="/" replace />
    }
    return (
        <BackgroundContainer>
            <ContentContainer>
                <SharedItemHeader sharedType="Tasks" />
                <SharedItemBodyContainer
                    content={
                        <>
                            <TitleContainer>
                                <GTTextField
                                    type="plaintext"
                                    value={task?.title ?? ''}
                                    onChange={emptyFunction}
                                    fontSize="large"
                                    disabled
                                    readOnly
                                />
                            </TitleContainer>
                            <TaskFieldContainer>
                                <GTDatePickerButton
                                    currentDate={DateTime.fromISO(task?.due_date ?? '')}
                                    showIcon
                                    onClick={emptyFunction}
                                    isOpen={false}
                                    disabled
                                    overrideDisabledStyle
                                />
                            </TaskFieldContainer>
                            <GTTextField
                                type="markdown"
                                value={task?.body ?? ''}
                                onChange={emptyFunction}
                                fontSize="small"
                                disabled
                                readOnly
                            />
                            {data?.subtasks && data?.subtasks.length > 0 && (
                                <SubtaskContainer>
                                    Subtasks
                                    <SubtaskList>
                                        {data?.subtasks?.map((subtask) => (
                                            <SubtaskBody key={subtask.id} subtask={subtask as TSubtask} />
                                        ))}
                                    </SubtaskList>
                                </SubtaskContainer>
                            )}
                        </>
                    }
                    footer={
                        <SharedWithText>{getSharedWithMessage(data?.domain, data?.task.shared_access)}</SharedWithText>
                    }
                />
            </ContentContainer>
        </BackgroundContainer>
    )
}

export default SharedTask
