import { render, screen } from '@testing-library/react'
import React from 'react'
import TaskHeader, { TaskHeaderProps } from '../TaskHeader'
import { Provider } from 'react-redux'
import store from '../../../redux/store'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

const commonTaskProp = {
    id: '1',
    id_external: '1',
    id_ordering: 1,
    datetime_end: null,
    datetime_start: null,
    deeplink: null,
    sender: null,
    title: 'faux scheduled task',
    source: {
        name: 'source',
        logo: 'logo',
        is_completable: false,
        is_replyable: true,
    },
    body: null,
    conference_call: null,
    emailSender: null,
    emailSentTime: null,
    sent_at: null,
}

const scheduledTaskHeaderProps: TaskHeaderProps = {
    task: commonTaskProp,
    datetimeStart: null,
    dragDisabled: true,
    isExpanded: false,
}

const unscheduledTaskHeaderProps: TaskHeaderProps = {
    task: commonTaskProp,
    datetimeStart: null,
    dragDisabled: false,
    isExpanded: false,
}

test('Scheduled task header does not have drag handler', () => {
    render(
        <Provider store={store}>
            <DndProvider backend={HTML5Backend}>
                <TaskHeader {...scheduledTaskHeaderProps}></TaskHeader>
            </DndProvider>
        </Provider>
    )
    expect(screen.queryByTestId('domino-handler')).toBeNull()
})

test('Uncheduled task does have drag handler', async () => {
    render(
        <Provider store={store}>
            <DndProvider backend={HTML5Backend}>
                <TaskHeader {...unscheduledTaskHeaderProps}></TaskHeader>
            </DndProvider>
        </Provider>
    )
    expect(screen.queryByTestId('domino-handler')).toBeTruthy()
})
