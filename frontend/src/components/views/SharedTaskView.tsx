import { Navigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { usePreviewMode } from '../../hooks'
import { useGetSharedTask } from '../../services/api/tasks.hooks'
import { Colors, Typography } from '../../styles'
import { emptyFunction } from '../../utils/utils'
import GTTextField from '../atoms/GTTextField'
import Spinner from '../atoms/Spinner'
import GTDatePickerButton from '../molecules/GTDatePickerButton'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import ContentContainer from '../molecules/shared_item_page/ContentContainer'
import SharedItemBodyContainer from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'

const SharedWithText = styled.div`
    ${Typography.body.small};
    color: ${Colors.text.muted};
    display: flex;
    align-items: center;
    justify-content: flex-end;
`
const SharedTask = () => {
    const { isPreviewMode, isLoading: isPreviewModeLoading } = usePreviewMode()
    const { taskId } = useParams()

    const { data, isLoading } = useGetSharedTask({ id: taskId ?? '' })
    const { task } = data ?? {}

    const domain = data?.domain && task?.shared_access === 'domain' ? ` ${data.domain}` : ''
    const sharedWithText = `Shared with everyone${domain} `

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
                            <GTTextField
                                type="plaintext"
                                value={task?.title ?? ''}
                                onChange={emptyFunction}
                                fontSize="large"
                                disabled
                                readOnly
                            />
                            <GTDatePickerButton
                                currentDate={DateTime.fromISO(task?.due_date ?? '')}
                                showIcon
                                onClick={emptyFunction}
                                isOpen={false}
                                disabled
                                overrideDisabledStyle
                            />
                            <GTTextField
                                type="markdown"
                                value={task?.body ?? ''}
                                onChange={emptyFunction}
                                fontSize="small"
                                disabled
                                readOnly
                            />
                        </>
                    }
                    footer={<SharedWithText>{sharedWithText}</SharedWithText>}
                />
            </ContentContainer>
        </BackgroundContainer>
    )
}

export default SharedTask
