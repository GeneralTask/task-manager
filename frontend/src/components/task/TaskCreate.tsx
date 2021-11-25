import * as styles from './TaskCreate-style'

import { GT_TASK_SOURCE_ID, TASKS_CREATE_URL } from '../../constants'
import React, { useState } from 'react'
import { fetchTasks, makeAuthorizedRequest } from '../../helpers/utils'

import GTButton from '../common/GTButton'
import { TTaskCreateParams } from '../../helpers/types'
import { flex } from '../../helpers/styles'
import { useSelector } from 'react-redux'
import store, { RootState } from '../../redux/store'
import { setShowCreateTaskForm } from '../../redux/actions'
import { parseDate } from '../../helpers/TimeParser'

export default function TaskCreate(): JSX.Element {
    const showCreateTaskForm = useSelector((state: RootState) => state.tasks_page.show_create_task_form)
    const [title, setTitle] = useState('')
    const [timeEstimate, setTimeEstimate] = useState('')
    const [dueDate, setDueDate] = useState('')

    const [titleError, setTitleError] = useState('')
    const [timeEstimateError, setTimeEstimateError] = useState('')
    const [dueDateError, setDueDateError] = useState('')

    return <>
        {showCreateTaskForm && <>
            <styles.OuterContainer>
                <styles.InnerContainer>
                    <styles.Side />
                    <styles.Form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault()

                        let tempTitleError = ''
                        let tempTimeEstimateError = ''
                        let tempDueDateError = ''

                        if (title === '') {
                            tempTitleError = 'Title is required'
                        }

                        let timeEstimateNum = -1
                        if (timeEstimate !== '') {
                            timeEstimateNum = parseInt(timeEstimate)
                            if (isNaN(timeEstimateNum)) {
                                tempTimeEstimateError = 'Time estimate must be a number'
                            }
                            else if (timeEstimateNum <= 0) {
                                tempTimeEstimateError = 'Time estimate must be greater than 0'
                            }
                        }

                        let parsedDueDate = ''
                        if (dueDate !== '') {
                            const parsedDate = parseDate(dueDate)

                            if (parsedDate == null) {
                                tempDueDateError = 'Could not parse due date'
                            }
                            else {
                                parsedDueDate = parsedDate.toISOString()
                            }
                        }

                        setTitleError(tempTitleError)
                        setTimeEstimateError(tempTimeEstimateError)
                        setDueDateError(tempDueDateError)

                        if (tempTitleError === '' && tempTimeEstimateError === '' && tempDueDateError === '') {
                            // no errors
                            const body: TTaskCreateParams = {
                                title,
                            }
                            if (timeEstimateNum > 0) {
                                body.time_duration = timeEstimateNum * 60
                            }
                            if (dueDate !== '' && parsedDueDate != null) {
                                body.due_date = parsedDueDate
                            }

                            setTitle('')
                            setTimeEstimate('')
                            setDueDate('')

                            console.log(body)

                            await makeAuthorizedRequest({
                                url: TASKS_CREATE_URL + GT_TASK_SOURCE_ID + '/',
                                method: 'POST',
                                body: JSON.stringify(body),
                            })
                            await fetchTasks()
                        }
                    }}>
                        <styles.InputTitle
                            placeholder='Describe Task'
                            value={title}
                            error={titleError !== ''}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
                        />
                        <styles.InputTimeEstimate
                            placeholder='Time Estimate (mins)'
                            value={timeEstimate}
                            error={timeEstimateError !== ''}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTimeEstimate(event.target.value)}
                        />
                        <styles.InputDueDate
                            placeholder='Due Date'
                            value={dueDate}
                            error={dueDateError !== ''}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDueDate(event.target.value)}
                        />
                        <styles.SaveBtnDiv>
                            <GTButton theme='black' width='80%' type='submit' >Save</GTButton>
                        </styles.SaveBtnDiv>
                    </styles.Form>
                    <styles.Side>
                        <styles.CloseButton src="images/close.svg" onClick={() => {
                            store.dispatch(setShowCreateTaskForm(false))
                        }} />
                    </styles.Side>
                </styles.InnerContainer >
                <styles.ErrorContainer>
                    {titleError && <flex.alignItemsCenter>
                        <styles.ErrorIcon src='/images/error.svg' />
                        <span>{titleError}</span>
                    </flex.alignItemsCenter>
                    }
                    {timeEstimateError && <flex.alignItemsCenter>
                        <styles.ErrorIcon src='/images/error.svg' />
                        <span>{timeEstimateError}</span>
                    </flex.alignItemsCenter>
                    }
                    {dueDateError && <flex.alignItemsCenter>
                        <styles.ErrorIcon src='/images/error.svg' />
                        <span>{dueDateError}</span>
                    </flex.alignItemsCenter>
                    }
                </styles.ErrorContainer>
            </styles.OuterContainer>
        </>}
    </>
}
