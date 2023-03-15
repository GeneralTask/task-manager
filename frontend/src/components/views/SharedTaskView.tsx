import { Navigate, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import { usePreviewMode } from '../../hooks'
import { useGetSharedTask } from '../../services/api/tasks.hooks'
import { emptyFunction } from '../../utils/utils'
import GTTextField from '../atoms/GTTextField'
import Spinner from '../atoms/Spinner'
import GTDatePickerButton from '../molecules/GTDatePickerButton'
import { BackgroundContainer } from '../molecules/shared_item_page/BackgroundContainer'
import ContentContainer from '../molecules/shared_item_page/ContentContainer'
import SharedItemBodyContainer from '../molecules/shared_item_page/SharedItemBody'
import SharedItemHeader from '../molecules/shared_item_page/SharedItemHeader'

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
                    footer={<div>this is a foooooter</div>}
                />
            </ContentContainer>
        </BackgroundContainer>
    )
}

export default SharedTask
