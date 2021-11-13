import { ErrorContainer, ErrorIcon, Form, InputDueDate, InputTimeEstimate, InputTitle, OuterContainer, SaveBtnDiv } from './TaskCreate-style'
import { GT_TASK_SOURCE_ID, TASKS_CREATE_URL } from '../../constants'
import React, { useState } from 'react'
import { fetchTasks, makeAuthorizedRequest } from '../../helpers/utils'

import GTButton from '../common/GTButton'
import { TTaskCreateParams } from '../../helpers/types'
import { flex } from '../../helpers/styles'

export default function TaskCreate(): JSX.Element {
    const [title, setTitle] = useState('')
    const [timeEstimate, setTimeEstimate] = useState('')
    const [dueDate, setDueDate] = useState('')

    const [titleError, setTitleError] = useState('')
    const [timeEstimateError, setTimeEstimateError] = useState('')
    const [dueDateError, setDueDateError] = useState('')

    return <OuterContainer>
        <Form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()

            let tempTitleError = ''
            let tempTimeEstimateError = ''
            const tempDueDateError = ''

            if (title === '') {
                tempTitleError = 'Title is required'
            }

            const timeEstimateNum = parseInt(timeEstimate)
            if (isNaN(timeEstimateNum)) {
                tempTimeEstimateError = 'Time estimate must be a number'
            }
            else if (timeEstimateNum <= 0) {
                tempTimeEstimateError = 'Time estimate must be greater than 0'
            }

            setTitleError(tempTitleError)
            setTimeEstimateError(tempTimeEstimateError)
            setDueDateError(tempDueDateError)

            if (titleError === '' && timeEstimateError === '' && dueDateError === '') {
                // no errors
                const body: TTaskCreateParams = {
                    title,
                }
                if (timeEstimateNum > 0) {
                    body.time_duration = timeEstimateNum * 60
                }
                await makeAuthorizedRequest({
                    url: TASKS_CREATE_URL + GT_TASK_SOURCE_ID + '/',
                    method: 'POST',
                    body: JSON.stringify(body),
                })
                await fetchTasks()
            }
        }}>
            <InputTitle
                placeholder='Describe Task'
                value={title}
                error={titleError !== ''}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
            />
            <InputTimeEstimate
                placeholder='Time Estimate (mins)'
                value={timeEstimate}
                error={timeEstimateError !== ''}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTimeEstimate(event.target.value)}
            />
            <InputDueDate
                placeholder='Due Date'
                value={dueDate}
                error={dueDateError !== ''}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDueDate(event.target.value)}
            />
            <SaveBtnDiv>
                <GTButton theme='black' width='80%' type='submit' >Save</GTButton>
            </SaveBtnDiv>
        </Form>
        <ErrorContainer>
            {titleError && <flex.alignItemsCenter>
                <ErrorIcon src='/images/error.svg' />
                <span>{titleError}</span>
            </flex.alignItemsCenter>
            }
            {timeEstimateError && <flex.alignItemsCenter>
                <ErrorIcon src='/images/error.svg' />
                <span>{timeEstimateError}</span>
            </flex.alignItemsCenter>
            }
            {dueDateError && <flex.alignItemsCenter>
                <ErrorIcon src='/images/error.svg' />
                <span>{dueDateError}</span>
            </flex.alignItemsCenter>
            }
        </ErrorContainer>
    </OuterContainer >
}

