import * as styles from './TaskCreate-style'

import { DEFAULT_ALLOCATION, GT_TASK_ICON, GT_TASK_SOURCE_ID, TASKS_CREATE_URL } from '../../constants'
import { KeyboardShortcut, useKeyboardShortcut } from '../common/KeyboardShortcut'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { logEvent, makeAuthorizedRequest, stopKeyboardPropogation } from '../../helpers/utils'

import { LogEvents } from '../../helpers/enums'
import { TTask, TTaskCreateParams, TTaskSection } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { useGetTasks } from './TasksPage'
import { useAppDispatch } from '../../redux/hooks'
import { addTask } from '../../redux/tasksPageSlice'

interface TaskCreateProps {
    task_section: TTaskSection
    task_section_index: number
}
export default function TaskCreate(props: TaskCreateProps): JSX.Element {
    const [isFocused, setIsFocused] = useState(false)

    const [title, setTitle] = useState('')

    const [titleError, setTitleError] = useState('')

    const getTasks = useGetTasks()

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

    const dispatch = useAppDispatch()

    const optimisticCreateTask = useCallback(
        (title: string) => {
            const task: TTask = {
                id: title,
                id_ordering: 0,
                title,
                deeplink: '',
                body: '',
                sent_at: '',
                time_allocated: DEFAULT_ALLOCATION,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: GT_TASK_ICON,
                    is_completable: true,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
            }
            dispatch(
                addTask({
                    task,
                    sectionIndex: props.task_section_index,
                    taskIndex: 0,
                })
            )
        },
        [props.task_section, props.task_section_index]
    )

    return (
        <>
            <styles.OuterContainer>
                <styles.InnerContainer>
                    <styles.Side />
                    <styles.Form
                        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                            e.preventDefault()

                            let tempTitleError = ''

                            if (title === '') {
                                tempTitleError = 'Title is required'
                            }

                            setTitleError(tempTitleError)

                            if (tempTitleError === '') {
                                // no errors
                                const body: TTaskCreateParams = {
                                    title: title,
                                    id_task_section: props.task_section.id,
                                }

                                setTitle('')

                                const res = makeAuthorizedRequest({
                                    url: TASKS_CREATE_URL + GT_TASK_SOURCE_ID + '/',
                                    method: 'POST',
                                    body: JSON.stringify(body),
                                })

                                optimisticCreateTask(title)

                                const response = await res

                                if (response.ok) {
                                    logEvent(LogEvents.TASK_CREATED)
                                }
                                await getTasks()
                            }
                        }}
                    >
                        <styles.PlusIcon src={`${process.env.PUBLIC_URL}/images/plus.svg`} />
                        <styles.InputTitle
                            placeholder="Add new task"
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
                </styles.InnerContainer>
                <styles.ErrorContainer>
                    {titleError && (
                        <flex.alignItemsCenter>
                            <styles.ErrorIcon src="/images/error.svg" />
                            <span>{titleError}</span>
                        </flex.alignItemsCenter>
                    )}
                </styles.ErrorContainer>
            </styles.OuterContainer>
        </>
    )
}
