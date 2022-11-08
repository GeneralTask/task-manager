import { useCallback, useRef } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { DETAILS_SYNC_TIMEOUT, REACT_APP_FRONTEND_BASE_URL, TRASH_SECTION_ID } from '../../constants'
import { useToast } from '../../hooks'
import { TModifyTaskData, useMarkTaskDoneOrDeleted, useModifyTask } from '../../services/api/tasks.hooks'
import { Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TTask } from '../../utils/types'
import GTTextField from '../atoms/GTTextField'
import { Icon } from '../atoms/Icon'
import NoStyleLink from '../atoms/NoStyleLink'
import Spinner from '../atoms/Spinner'
import GTButton from '../atoms/buttons/GTButton'
import { Label } from '../atoms/typography/Typography'
import DetailsViewTemplate from '../templates/DetailsViewTemplate'
import TaskBody from './TaskBody'

const TITLE_MAX_HEIGHT = 208
const TASK_TITLE_MAX_WIDTH = 125

const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-basis: 50px;
    flex-shrink: 0;
`
const MarginLeftAuto = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: auto;
`
const DetailItem = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${Spacing._8};
    max-width: ${TASK_TITLE_MAX_WIDTH}px;
    display: block;
`
const BackButtonContainer = styled(NoStyleLink)`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    ${Typography.mini};
`
const BackButtonText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const SYNC_MESSAGES = {
    SYNCING: 'Syncing...',
    ERROR: 'There was an error syncing with our servers',
    COMPLETE: '',
}

interface TaskDetailsProps {
    task: TTask
    subtask?: TTask
    link: string
}
const TaskDetails = ({ task, subtask, link }: TaskDetailsProps) => {
    const currentTask = subtask || task
    const [isEditing, setIsEditing] = useState(false)
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)

    const { mutate: modifyTask, isError, isLoading } = useModifyTask()
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})

    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()

    const isInTrash = params.section === TRASH_SECTION_ID

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    /* when the optimistic ID changes to undefined, we know that that task.id is now the real ID
    so we can then navigate to the correct link */
    useEffect(() => {
        if (!currentTask.isOptimistic && location.pathname !== link) {
            navigate(link)
        }
    }, [currentTask.isOptimistic, location, link])

    useEffect(() => {
        ReactTooltip.rebuild()
        return () => {
            for (const timer of Object.values(timers.current)) {
                timer.callback()
                clearTimeout(timer.timeout)
            }
        }
    }, [])

    const syncDetails = useCallback(
        ({ id, title, body }: TModifyTaskData) => {
            setIsEditing(false)
            const timerId = id + (title === undefined ? 'body' : 'title')
            if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
            modifyTask({ id, title, body })
        },
        [currentTask.id, modifyTask]
    )

    const onEdit = ({ id, title, body }: TModifyTaskData) => {
        setIsEditing(true)
        const timerId = id + (title === undefined ? 'body' : 'title') // we're only modifying the body or title, one at a time
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        timers.current[timerId] = {
            timeout: setTimeout(() => syncDetails({ id, title, body }), DETAILS_SYNC_TIMEOUT),
            callback: () => syncDetails({ id, title, body }),
        }
    }

    const toast = useToast()

    return (
        <DetailsViewTemplate>
            <DetailsTopContainer>
                <DetailItem>
                    {subtask ? (
                        <BackButtonContainer to=".." relative="path">
                            <Icon icon={icons.caret_left} color="purple" />
                            <BackButtonText>{task.title}</BackButtonText>
                        </BackButtonContainer>
                    ) : (
                        <Icon icon={logos[currentTask.source.logo_v2]} />
                    )}
                </DetailItem>
                {!currentTask.isOptimistic && (
                    <>
                        <DetailItem>
                            <Label color="light">{syncIndicatorText}</Label>
                        </DetailItem>
                        {!subtask && (
                            <MarginLeftAuto>
                                {isInTrash && (
                                    <GTButton
                                        value="Restore Task"
                                        onClick={() =>
                                            markTaskDoneOrDeleted({ taskId: currentTask.id, isDeleted: false })
                                        }
                                        styleType="secondary"
                                        size="small"
                                    />
                                )}
                                <GTButton
                                    value="Copy Note Link"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${REACT_APP_FRONTEND_BASE_URL}/note/${task.id}`)
                                        toast.show(
                                            {
                                                message: `Note URL copied to clipboard`,
                                            },
                                            {
                                                autoClose: 2000,
                                                pauseOnFocusLoss: false,
                                                theme: 'dark',
                                            }
                                        )
                                    }}
                                    styleType="secondary"
                                    size="small"
                                />
                            </MarginLeftAuto>
                        )}
                    </>
                )}
            </DetailsTopContainer>
            <div>
                <GTTextField
                    type="plaintext"
                    itemId={currentTask.id}
                    value={isInTrash ? `${currentTask.title} (deleted)` : currentTask.title}
                    disabled={currentTask.isOptimistic || currentTask.nux_number_id > 0 || isInTrash}
                    onChange={(val) => onEdit({ id: currentTask.id, title: val })}
                    maxHeight={TITLE_MAX_HEIGHT}
                    fontSize="medium"
                    hideUnfocusedOutline
                    blurOnEnter
                />
            </div>
            {currentTask.isOptimistic ? (
                <Spinner />
            ) : (
                <>
                    <TaskBody
                        task={currentTask}
                        onChange={(val) => onEdit({ id: currentTask.id, body: val })}
                        disabled={isInTrash}
                    />
                </>
            )}
        </DetailsViewTemplate>
    )
}

export default TaskDetails
