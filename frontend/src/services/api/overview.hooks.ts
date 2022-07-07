import produce from "immer"
import { useState } from "react"
import { TOverviewView, TSupportedOverviewView } from "../../utils/types"
import { arrayMoveInPlace } from "../../utils/utils"

const dummyOverviewViews: TOverviewView[] = [
    {
        id: '1',
        name: 'My tasks',
        type: 'task_section',
        section_id: 'section 1',
        is_paginated: false,
        is_reorderable: true,
        logo: 'generaltask',
        view_items: [
            {
                id: '1',
                id_ordering: 1,
                title: 'Check in with Scott',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '2',
                id_ordering: 2,
                title: 'Check in with Nolan',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '3',
                id_ordering: 3,
                title: 'Buy more Waterloo',
                body: 'black cherry only >:o',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
    {
        id: '2',
        name: 'Your tasks',
        type: 'task_section',
        section_id: 'section 2',
        is_paginated: false,
        is_reorderable: true,
        logo: 'generaltask',
        view_items: [
            {
                id: '4',
                id_ordering: 1,
                title: 'Check in with Scott',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '5',
                id_ordering: 2,
                title: 'Check in with Nolan',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '6',
                id_ordering: 3,
                title: 'Buy more Waterloo',
                body: 'black cherry only >:o',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
    {
        id: '3',
        name: 'Backlog',
        type: 'task_section',
        section_id: 'section 3',
        is_paginated: false,
        is_reorderable: false,
        logo: 'generaltask',
        view_items: [
            {
                id: '7',
                id_ordering: 1,
                title: 'Check in with Scott',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '8',
                id_ordering: 2,
                title: 'Check in with Nolan',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '9',
                id_ordering: 3,
                title: 'Buy more Waterloo',
                body: 'black cherry only >:o',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
    {
        id: '4',
        name: 'Linear',
        type: 'linear',
        is_paginated: false,
        is_reorderable: true,
        logo: 'linear',
        view_items: [
            {
                id: '10',
                id_ordering: 1,
                title: 'Fix key error on AddViewModal',
                body: 'no description, unless??',
                deeplink: 'https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'Linear',
                    logo: '',
                    logo_v2: 'linear',
                    is_completable: true,
                    is_replyable: false,
                },
                external_status: {
                    state: 'Todo',
                    type: 'unstarted',
                },
                comments: [
                    {
                        body: 'possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)',
                        user: {
                            ExternalID: '4c2421c6-9079-48ba-953a-b5faafe2b782',
                            Name: 'Jack Hamilton',
                            DisplayName: 'jack',
                            Email: 'jack@generaltask.com',
                        },
                        created_at: '2022-07-06T20:49:41.409Z',
                    },
                    {
                        body: '![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails',
                        user: {
                            ExternalID: 'b494ee99-47a4-4f29-abe4-c17a29308ee6',
                            Name: 'John Reinstra',
                            DisplayName: 'john',
                            Email: 'john@generaltask.com',
                        },
                        created_at: '2022-07-05T00:27:00.945Z',
                    }
                ],
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '11',
                id_ordering: 2,
                title: 'Fix key error on AddViewModal 2',
                body: 'no description, unless?? 2',
                deeplink: 'https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'Linear',
                    logo: '',
                    logo_v2: 'linear',
                    is_completable: true,
                    is_replyable: false,
                },
                external_status: {
                    state: 'Todo',
                    type: 'unstarted',
                },
                comments: [
                    {
                        body: 'possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)',
                        user: {
                            ExternalID: '4c2421c6-9079-48ba-953a-b5faafe2b782',
                            Name: 'Jack Hamilton',
                            DisplayName: 'jack',
                            Email: 'jack@generaltask.com',
                        },
                        created_at: '2022-07-06T20:49:41.409Z',
                    },
                    {
                        body: '![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails',
                        user: {
                            ExternalID: 'b494ee99-47a4-4f29-abe4-c17a29308ee6',
                            Name: 'John Reinstra',
                            DisplayName: 'john',
                            Email: 'john@generaltask.com',
                        },
                        created_at: '2022-07-05T00:27:00.945Z',
                    }
                ],
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '12',
                id_ordering: 3,
                title: 'Fix key error on AddViewModal 3',
                body: 'no description, unless?? 3',
                deeplink: 'https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'Linear',
                    logo: '',
                    logo_v2: 'linear',
                    is_completable: true,
                    is_replyable: false,
                },
                external_status: {
                    state: 'Todo',
                    type: 'unstarted',
                },
                comments: [
                    {
                        body: 'possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)',
                        user: {
                            ExternalID: '4c2421c6-9079-48ba-953a-b5faafe2b782',
                            Name: 'Jack Hamilton',
                            DisplayName: 'jack',
                            Email: 'jack@generaltask.com',
                        },
                        created_at: '2022-07-06T20:49:41.409Z',
                    },
                    {
                        body: '![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails',
                        user: {
                            ExternalID: 'b494ee99-47a4-4f29-abe4-c17a29308ee6',
                            Name: 'John Reinstra',
                            DisplayName: 'john',
                            Email: 'john@generaltask.com',
                        },
                        created_at: '2022-07-05T00:27:00.945Z',
                    }
                ],
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
]

const dummySupportedViews = [
    {
        id: 'default tasks',
        name: 'Default tasks',
        logo: 'generaltask',
        is_added: true,
    },
    {
        id: 'Work',
        name: 'Work',
        logo: 'generaltask',
        is_added: false,
    },
    {
        id: 'Home',
        name: 'Home',
        logo: 'generaltask',
        is_added: false,
    },
    {
        id: 'Github',
        name: 'Github',
        logo: 'github',
        is_added: true,
    },
    {
        id: 'Gmail',
        name: 'Gmail',
        logo: 'gmail',
        is_added: true,
    },
    {
        id: 'Linear',
        name: 'Linear',
        logo: 'linear',
        is_added: true,
    },
    {
        id: 'Slack',
        name: 'Slack',
        logo: 'slack',
        is_added: false,
    },
]

export const useGetOverviewViews = () => {
    const [views, setViews] = useState(dummyOverviewViews)

    const temporaryReorderViews = (viewId: string, idOrdering: number) => {
        const newViews = produce(views, draft => {
            const startIndex = draft.findIndex(view => view.id === viewId)
            let endIndex = idOrdering - 1
            if (startIndex < endIndex) {
                endIndex -= 1
            }
            if (startIndex === -1 || endIndex === -1) return
            arrayMoveInPlace(draft, startIndex, endIndex)
        })
        setViews(newViews)
    }

    return { data: views, temporaryReorderViews }
}


export const useGetSupportedViews = () => {
    const [supportedViews, setSupportedViews] = useState<TSupportedOverviewView[]>(dummySupportedViews)

    const temporaryAddOrRemoveViewFunc = (viewId: string, isAdded: boolean) => {
        const newSupportedViews = produce(supportedViews, draft => {
            const view = draft.find(view => view.id === viewId)
            if (view) {
                view.is_added = isAdded
            }
        })
        setSupportedViews(newSupportedViews)
    }

    return { data: supportedViews, temporaryAddOrRemoveViewFunc }
}

