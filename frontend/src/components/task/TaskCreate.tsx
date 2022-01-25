import * as styles from './TaskCreate-style'

import { GT_TASK_SOURCE_ID, TASKS_CREATE_URL } from '../../constants'
import React, { useCallback, useState } from 'react'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { useFetchTasks } from './TasksPage'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { TTaskCreateParams } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { setShowCreateTaskForm } from '../../redux/tasksPageSlice'
import { LogEvents } from '../../helpers/enums'

export default function TaskCreate(): JSX.Element {
    const showCreateTaskForm = useAppSelector((state) => state.tasks_page.tasks.show_create_task_form)
    const dispatch = useAppDispatch()

    const [title, setTitle] = useState('')

    const [titleError, setTitleError] = useState('')

    const fetchTasks = useFetchTasks()

    const closeCreateTaskForm = useCallback(() => {
        dispatch(setShowCreateTaskForm(false))
        logEvent(LogEvents.HIDE_TASK_CREATE_FORM)
    }, [])

    return <>
        {showCreateTaskForm && <>
            <styles.OuterContainer>
                <styles.InnerContainer>
                    <styles.Side />
                    <styles.Form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault()

                        let tempTitleError = ''

                        if (title === '') {
                            tempTitleError = 'Title is required'
                        }

                        setTitleError(tempTitleError)

                        if (tempTitleError === '') {
                            // no errors
                            const body: TTaskCreateParams = {
                                title,
                            }

                            setTitle('')

                            const response = await makeAuthorizedRequest({
                                url: TASKS_CREATE_URL + GT_TASK_SOURCE_ID + '/',
                                method: 'POST',
                                body: JSON.stringify(body),
                            })
                            if (response.ok) {
                                logEvent(LogEvents.TASK_CREATED)
                            }
                            await fetchTasks()
                        }
                    }}>
                        <styles.InputTitle
                            placeholder='Describe Task'
                            value={title}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
                            onKeyDown={e => e.stopPropagation()}
                        />
                    </styles.Form>
                    <styles.Side>
                        <styles.CloseButton src={`${process.env.PUBLIC_URL}/images/close.svg`} onClick={closeCreateTaskForm} />
                    </styles.Side>
                </styles.InnerContainer >
                <styles.ErrorContainer>
                    {titleError && <flex.alignItemsCenter>
                        <styles.ErrorIcon src='/images/error.svg' />
                        <span>{titleError}</span>
                    </flex.alignItemsCenter>
                    }
                </styles.ErrorContainer>
            </styles.OuterContainer>
        </>}
    </>
}
