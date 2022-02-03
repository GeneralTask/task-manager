import * as styles from './TaskCreate-style'

import { GT_TASK_SOURCE_ID, TASKS_CREATE_URL } from '../../constants'
import { KeyboardShortcut, useKeyboardShortcut } from '../common/KeyboardShortcut'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { logEvent, makeAuthorizedRequest, stopKeyboardPropogation } from '../../helpers/utils'

import { LogEvents } from '../../helpers/enums'
import { TTaskCreateParams } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { useFetchTasks } from './TasksPage'

export default function TaskCreate(): JSX.Element {
    const [isFocused, setIsFocused] = useState(false)

    const [title, setTitle] = useState('')

    const [titleError, setTitleError] = useState('')

    const fetchTasks = useFetchTasks()

    const titleRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isFocused) {
            titleRef.current?.focus()
        } else {
            titleRef.current?.blur()
        }
    }, [isFocused])

    const onBlur = useCallback(() => setIsFocused(false), [])
    useKeyboardShortcut('Escape', onBlur)

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
                        onKeyDown={stopKeyboardPropogation}
                        onBlur={onBlur}
                        ref={titleRef}
                    />
                    <KeyboardShortcut shortcut="T" onKeyPress={() => setIsFocused(true)} />
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
