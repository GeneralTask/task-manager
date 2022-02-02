import * as styles from './TaskCreate-style'

import { GT_TASK_SOURCE_ID, TASKS_CREATE_URL } from '../../constants'
import React, { useEffect, useRef, useState } from 'react'
import { logEvent, makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { LogEvents } from '../../helpers/enums'
import { TTaskCreateParams } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { useFetchTasks } from './TasksPage'
import { setFocusCreateTaskForm } from '../../redux/tasksPageSlice'
import { KeyboardShortcut } from '../common/KeyboardShortcut'

export default function TaskCreate(): JSX.Element {
    const focusCreateTaskForm = useAppSelector((state) => state.tasks_page.tasks.focus_create_task_form)
    const dispatch = useAppDispatch()

    const [title, setTitle] = useState('')

    const [titleError, setTitleError] = useState('')

    const fetchTasks = useFetchTasks()

    const titleRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (focusCreateTaskForm) {
            titleRef.current?.focus()
            dispatch(setFocusCreateTaskForm(false))
        }
    }, [focusCreateTaskForm])


    return <>
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
                    <styles.PlusIcon src={`${process.env.PUBLIC_URL}/images/plus.svg`} />
                    <styles.InputTitle
                        placeholder='Add new task'
                        value={title}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
                        // to prevent inputs from triggering keyboard shortcuts
                        onKeyDown={e => e.stopPropagation()}
                        ref={titleRef}
                    />
                    <KeyboardShortcut shortcut="n" onKeyPress={() => console.log('hi')} />
                </styles.Form>
                <styles.Side />
            </styles.InnerContainer >
            <styles.ErrorContainer>
                {titleError && <flex.alignItemsCenter>
                    <styles.ErrorIcon src='/images/error.svg' />
                    <span>{titleError}</span>
                </flex.alignItemsCenter>
                }
            </styles.ErrorContainer>
        </styles.OuterContainer>
    </>
}
