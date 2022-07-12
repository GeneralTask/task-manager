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
        view_items: [{
            "id": "1",
            "id_ordering": 1,
            "title": "so I called Barry. Luckily, he was free.",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "2",
            "id_ordering": 2,
            "title": "What's number one? Star Wars?",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "3",
            "id_ordering": 3,
            "title": "You're monsters!",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "4",
            "id_ordering": 4,
            "title": "How much longer will this go on?",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "5",
            "id_ordering": 5,
            "title": "I thought maybe you were remodeling.",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "6",
            "id_ordering": 6,
            "title": "All right. Take ten, everybody. Wrap it up, guys.",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "7",
            "id_ordering": 7,
            "title": "I'm going to pincushion this guy!",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "8",
            "id_ordering": 8,
            "title": "Thinking bee! Thinking bee!",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "9",
            "id_ordering": 9,
            "title": "I'm not trying to be funny.",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "10",
            "id_ordering": 10,
            "title": "Ken, could you close the window please?",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "11",
            "id_ordering": 11,
            "title": "Wait for my signal. Take him out.",
            "body": "pls",
            "deeplink": "",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "General Task",
                "logo": "",
                "logo_v2": "generaltask",
                "is_completable": false,
                "is_replyable": false
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }],
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
                id: '4asdfasdfasd',
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
                id: '5asdfasdfasdfasdf',
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
                id: 'asdfasdfasdf6',
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
                id: '7asdfasdfasdfadsfasdf',
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
                id: '8asdfasdfasdfsadfasdf',
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
                id: '9adsfdsfasdfasdfasd',
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
        is_reorderable: false,
        logo: 'linear',
        view_items: [{
            "id": "100",
            "id_ordering": 100,
            "title": "What? You're not dead?",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "101",
            "id_ordering": 101,
            "title": "Dumb bees!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "102",
            "id_ordering": 102,
            "title": "That's why this is the last parade.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "103",
            "id_ordering": 103,
            "title": "Ken, I'm wearing a Chapstick hat!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "104",
            "id_ordering": 104,
            "title": "He finally gets there.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "105",
            "id_ordering": 105,
            "title": "Moose blood guy!!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "106",
            "id_ordering": 106,
            "title": "It must be dangerous being a Pollen Jock.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "107",
            "id_ordering": 107,
            "title": "And for your information, I prefer sugar-free, artificial sweeteners made by man!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "108",
            "id_ordering": 108,
            "title": "According to all known laws of aviation",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "109",
            "id_ordering": 109,
            "title": "My only interest is flowers.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "110",
            "id_ordering": 110,
            "title": "I believe I'm the pea.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "111",
            "id_ordering": 111,
            "title": "I'm picking up a lot of bright yellow, Could be daisies, Don't we need those?",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Linear",
                "logo": "",
                "logo_v2": "linear",
                "is_completable": true,
                "is_replyable": false
            },
            "external_status": {
                "state": "Todo",
                "type": "unstarted"
            },
            "comments": [{
                "body": "possible resource: [https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application](https://stackoverflow.com/questions/26499759/how-to-display-an-html-email-in-a-web-application)",
                "user": {
                    "ExternalID": "4c2421c6-9079-48ba-953a-b5faafe2b782",
                    "Name": "Jack Hamilton",
                    "DisplayName": "jack",
                    "Email": "jack@generaltask.com"
                },
                "created_at": "2022-07-06T20:49:41.409Z"
            }, {
                "body": "![image.png](https://uploads.linear.app/572f6728-59c0-4844-96b1-34b5e77b704e/25a0d73b-b120-4669-94f0-0dca972218a6/403cc0a9-c176-48bf-b521-c5193eefb9dc)\n\nthis is pretty embarrassingly bad for some of my emails",
                "user": {
                    "ExternalID": "b494ee99-47a4-4f29-abe4-c17a29308ee6",
                    "Name": "John Reinstra",
                    "DisplayName": "john",
                    "Email": "john@generaltask.com"
                },
                "created_at": "2022-07-05T00:27:00.945Z"
            }],
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }],
    },
    {
        id: '5',
        name: 'Slack',
        type: 'slack',
        is_paginated: false,
        is_reorderable: false,
        logo: 'slack',
        view_items: [{
            "id": "200",
            "id_ordering": 200,
            "title": "That flower.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "201",
            "id_ordering": 201,
            "title": "Barry, you are so funny sometimes.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "202",
            "id_ordering": 202,
            "title": "He'll have nauseous for a few hours, then he'll be fine.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "203",
            "id_ordering": 203,
            "title": "They're very lovable creatures. Yogi Bear, Fozzie Bear, Build-A-Bear.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "204",
            "id_ordering": 204,
            "title": "That bee is living my life!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "205",
            "id_ordering": 205,
            "title": "Picking crud out. Stellar!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "206",
            "id_ordering": 206,
            "title": "Well, there's a lot of choices.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "207",
            "id_ordering": 207,
            "title": "OK.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "208",
            "id_ordering": 208,
            "title": "Specifically, me.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "209",
            "id_ordering": 209,
            "title": "Yeah, right.",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "210",
            "id_ordering": 210,
            "title": "It was amazing!",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }, {
            "id": "211",
            "id_ordering": 211,
            "title": "From NPR News in Washington,",
            "body": "no description, unless??",
            "deeplink": "https://linear.app/general-task/issue/FRO-285/fix-key-error-on-addviewmodal",
            "sent_at": "",
            "time_allocated": 0,
            "due_date": "",
            "source": {
                "name": "Slack",
                "logo": "",
                "logo_v2": "slack",
                "is_completable": true,
                "is_replyable": false
            },
            "slack_message_params": {
                "channel": {
                    "id": "D029MQVASHL",
                    "name": "directmessage"
                },
                "user": {
                    "id": "U02A0P4D61J",
                    "name": "christensen_julian"
                },
                "team": {
                    "id": "T01ML9H5LJD",
                    "domain": "generaltask"
                },
                "message": {
                    "type": "message",
                    "user": "U025FVDFA91",
                    "ts": 1656029353.050629,
                    "text": "good stuff thanks :+1:"
                }
            },
            "sender": "",
            "is_done": false,
            "recipients": {
                "to": [],
                "cc": [],
                "bcc": []
            }
        }],
    },
    {
        id: '6',
        name: 'Gmail',
        type: 'message',
        is_paginated: false,
        is_reorderable: false,
        logo: 'gmail',
        view_items: [
            {
                id: '16',
                deeplink: '',
                source: {
                    account_id: 'jack@generaltask.com',
                    name: 'Jack Hamilton',
                    logo: '',
                    logo_v2: 'gmail',
                    is_completable: false,
                    is_replyable: false,
                },
                is_archived: false,
                emails: [
                    {
                        message_id: '62bf6d62780ba686a617f2e9',
                        subject: 'Blah blah blah email!!! (jack@generaltask.com)',
                        body: '<span itemscope itemtype="http://schema.org/InformAction"><span style="display:none" itemprop="about" itemscope itemtype="http://schema.org/Person"><meta itemprop="description" content="John Reinstra accepted"/></span><span itemprop="object" itemscope itemtype="http://schema.org/Event"><div style=""><table cellspacing="0" cellpadding="8" border="0" summary="" style="width:100%;font-family:Arial,Sans-serif;border:1px Solid #ccc;border-width:1px 2px 2px 1px;background-color:#fff;"><tr><td><div style="padding:6px 10px;margin:0 0 4px 0;font-family:Arial,Sans-serif;font-size:13px;line-height:1.4;border:1px Solid #ccc;background:#ffc;color:#222"><strong><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">John Reinstra</span><meta itemprop="email" content="john@generaltask.com"/></span> has accepted this invitation.</strong></div><div style="padding:2px"><span itemprop="publisher" itemscope itemtype="http://schema.org/Organization"><meta itemprop="name" content="Google Calendar"/></span><meta itemprop="eventId/googleCalendar" content="294ca8qer3ahtm6flqvfv6ufgj"/><h3 style="padding:0 0 6px 0;margin:0;font-family:Arial,Sans-serif;font-size:16px;font-weight:bold;color:#222"><span itemprop="name">Private room at 801 Chophouse</span></h3><table style="display:inline-table" cellpadding="0" cellspacing="0" border="0" summary="Event details"><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">When</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><time itemprop="startDate" datetime="20220714T231500Z"></time><time itemprop="endDate" datetime="20220715T011500Z"></time>Thu Jul 14, 2022 4:15pm – 6:15pm <span style="color:#888">Pacific Time - Los Angeles</span></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Where</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span itemprop="location" itemscope itemtype="http://schema.org/Place"><span itemprop="name" class="notranslate">137 Carondelet Plaza, Clayton, MO 63105, USA</span><span dir="ltr"> (<a href="https://www.google.com/maps/search/137+Carondelet+Plaza,+Clayton,+MO+63105,+USA?hl=en" style="color:#20c;white-space:nowrap" target="_blank" itemprop="map">map</a>)</span></span></td></tr><tr><td style="padding:0 1em 4px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Joining info</i></div></td><td style="padding-bottom:4px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">Join with Google Meet</td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span itemprop="potentialaction" itemscope itemtype="http://schema.org/JoinAction"><span itemprop="name" content="meet.google.com/uiu-bqvd-bys"><span itemprop="target" itemscope itemtype="http://schema.org/EntryPoint"><span itemprop="url" content="https://meet.google.com/uiu-bqvd-bys?hs=224"><span itemprop="httpMethod" content="GET"><a href="https://meet.google.com/uiu-bqvd-bys?hs=224" style="color:#20c;white-space:nowrap" target="_blank">meet.google.com/uiu-bqvd-bys</a></span></span></span></span></span> </td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"></td></tr><td style="padding:0 1em 4px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:4px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">Join by phone</td><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span style="color:#888">(US) </span><a href="tel:+1-678-567-4823%3B363214567%23" style="color:#20c;white-space:nowrap" target="_blank">+1 678-567-4823</a> <span style="color:#888">(PIN: 363214567)</span></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><a href="https://tel.meet/uiu-bqvd-bys?pin=7261788975958&hs=0" style="color:#20c;white-space:nowrap" target="_blank">More phone numbers</a></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Calendar</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">jack@generaltask.com</td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Who</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><table cellspacing="0" cellpadding="0"><tr><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><span style="font-family:Courier New,monospace">&#x2022;</span></td><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><div><div style="margin:0 0 0.3em 0"><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">jack@generaltask.com</span><meta itemprop="email" content="jack@generaltask.com"/></span><span itemprop="organizer" itemscope itemtype="http://schema.org/Person"><meta itemprop="name" content="jack@generaltask.com"/><meta itemprop="email" content="jack@generaltask.com"/></span><span style="font-size:11px;color:#888"> - organizer</span></div></div></td></tr><tr><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><span style="font-family:Courier New,monospace">&#x2022;</span></td><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><div><div style="margin:0 0 0.3em 0"><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">john@generaltask.com</span><meta itemprop="email" content="john@generaltask.com"/></span></div></div></td></tr></table></td></tr></table></div></td></tr><tr><td style="background-color:#f6f6f6;color:#888;border-top:1px Solid #ccc;font-family:Arial,Sans-serif;font-size:11px"><p>Invitation from <a href="https://calendar.google.com/calendar/" target="_blank" style="">Google Calendar</a></p><p>You are receiving this email at the account jack@generaltask.com because you are subscribed for invitation replies on calendar jack@generaltask.com.</p><p>To stop receiving these emails, please log in to https://calendar.google.com/calendar/ and change your notification settings for this calendar.</p><p>Forwarding this invitation could allow any recipient to send a response to the organizer and be added to the guest list, or invite others regardless of their own invitation status, or to modify your RSVP. <a href="https://support.google.com/calendar/answer/37135#forwarding">Learn More</a>.</p></td></tr></table></div></span></span>',
                        sent_at: '2022-07-01T21:24:16.000Z',
                        is_unread: false,
                        sender: {
                            name: 'John Reinstra',
                            email: 'john@generaltask.com',
                            reply_to: 'John Reinstra <john@generaltask.com>',
                        },
                        recipients: {
                            to: [
                                {
                                    name: '',
                                    email: 'jack@generaltask.com'
                                }
                            ],
                            cc: [],
                            bcc: [],
                        },
                        num_attachments: 2
                    }
                ],
            },
            {
                id: '17',
                deeplink: '',
                source: {
                    account_id: 'jack@generaltask.com',
                    name: 'Jack Hamilton',
                    logo: '',
                    logo_v2: 'gmail',
                    is_completable: false,
                    is_replyable: false,
                },
                is_archived: false,
                emails: [
                    {
                        message_id: '62bf6d62780ba686a617f2e9',
                        subject: 'Blah blah blah email!!! (jack@generaltask.com)',
                        body: '<span itemscope itemtype="http://schema.org/InformAction"><span style="display:none" itemprop="about" itemscope itemtype="http://schema.org/Person"><meta itemprop="description" content="John Reinstra accepted"/></span><span itemprop="object" itemscope itemtype="http://schema.org/Event"><div style=""><table cellspacing="0" cellpadding="8" border="0" summary="" style="width:100%;font-family:Arial,Sans-serif;border:1px Solid #ccc;border-width:1px 2px 2px 1px;background-color:#fff;"><tr><td><div style="padding:6px 10px;margin:0 0 4px 0;font-family:Arial,Sans-serif;font-size:13px;line-height:1.4;border:1px Solid #ccc;background:#ffc;color:#222"><strong><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">John Reinstra</span><meta itemprop="email" content="john@generaltask.com"/></span> has accepted this invitation.</strong></div><div style="padding:2px"><span itemprop="publisher" itemscope itemtype="http://schema.org/Organization"><meta itemprop="name" content="Google Calendar"/></span><meta itemprop="eventId/googleCalendar" content="294ca8qer3ahtm6flqvfv6ufgj"/><h3 style="padding:0 0 6px 0;margin:0;font-family:Arial,Sans-serif;font-size:16px;font-weight:bold;color:#222"><span itemprop="name">Private room at 801 Chophouse</span></h3><table style="display:inline-table" cellpadding="0" cellspacing="0" border="0" summary="Event details"><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">When</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><time itemprop="startDate" datetime="20220714T231500Z"></time><time itemprop="endDate" datetime="20220715T011500Z"></time>Thu Jul 14, 2022 4:15pm – 6:15pm <span style="color:#888">Pacific Time - Los Angeles</span></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Where</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span itemprop="location" itemscope itemtype="http://schema.org/Place"><span itemprop="name" class="notranslate">137 Carondelet Plaza, Clayton, MO 63105, USA</span><span dir="ltr"> (<a href="https://www.google.com/maps/search/137+Carondelet+Plaza,+Clayton,+MO+63105,+USA?hl=en" style="color:#20c;white-space:nowrap" target="_blank" itemprop="map">map</a>)</span></span></td></tr><tr><td style="padding:0 1em 4px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Joining info</i></div></td><td style="padding-bottom:4px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">Join with Google Meet</td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span itemprop="potentialaction" itemscope itemtype="http://schema.org/JoinAction"><span itemprop="name" content="meet.google.com/uiu-bqvd-bys"><span itemprop="target" itemscope itemtype="http://schema.org/EntryPoint"><span itemprop="url" content="https://meet.google.com/uiu-bqvd-bys?hs=224"><span itemprop="httpMethod" content="GET"><a href="https://meet.google.com/uiu-bqvd-bys?hs=224" style="color:#20c;white-space:nowrap" target="_blank">meet.google.com/uiu-bqvd-bys</a></span></span></span></span></span> </td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"></td></tr><td style="padding:0 1em 4px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:4px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">Join by phone</td><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span style="color:#888">(US) </span><a href="tel:+1-678-567-4823%3B363214567%23" style="color:#20c;white-space:nowrap" target="_blank">+1 678-567-4823</a> <span style="color:#888">(PIN: 363214567)</span></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><a href="https://tel.meet/uiu-bqvd-bys?pin=7261788975958&hs=0" style="color:#20c;white-space:nowrap" target="_blank">More phone numbers</a></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Calendar</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">jack@generaltask.com</td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Who</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><table cellspacing="0" cellpadding="0"><tr><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><span style="font-family:Courier New,monospace">&#x2022;</span></td><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><div><div style="margin:0 0 0.3em 0"><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">jack@generaltask.com</span><meta itemprop="email" content="jack@generaltask.com"/></span><span itemprop="organizer" itemscope itemtype="http://schema.org/Person"><meta itemprop="name" content="jack@generaltask.com"/><meta itemprop="email" content="jack@generaltask.com"/></span><span style="font-size:11px;color:#888"> - organizer</span></div></div></td></tr><tr><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><span style="font-family:Courier New,monospace">&#x2022;</span></td><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><div><div style="margin:0 0 0.3em 0"><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">john@generaltask.com</span><meta itemprop="email" content="john@generaltask.com"/></span></div></div></td></tr></table></td></tr></table></div></td></tr><tr><td style="background-color:#f6f6f6;color:#888;border-top:1px Solid #ccc;font-family:Arial,Sans-serif;font-size:11px"><p>Invitation from <a href="https://calendar.google.com/calendar/" target="_blank" style="">Google Calendar</a></p><p>You are receiving this email at the account jack@generaltask.com because you are subscribed for invitation replies on calendar jack@generaltask.com.</p><p>To stop receiving these emails, please log in to https://calendar.google.com/calendar/ and change your notification settings for this calendar.</p><p>Forwarding this invitation could allow any recipient to send a response to the organizer and be added to the guest list, or invite others regardless of their own invitation status, or to modify your RSVP. <a href="https://support.google.com/calendar/answer/37135#forwarding">Learn More</a>.</p></td></tr></table></div></span></span>',
                        sent_at: '2022-07-01T21:24:16.000Z',
                        is_unread: false,
                        sender: {
                            name: 'John Reinstra',
                            email: 'john@generaltask.com',
                            reply_to: 'John Reinstra <john@generaltask.com>',
                        },
                        recipients: {
                            to: [
                                {
                                    name: '',
                                    email: 'jack@generaltask.com'
                                }
                            ],
                            cc: [],
                            bcc: [],
                        },
                        num_attachments: 2
                    }
                ],
            },
            {
                id: '18',
                deeplink: '',
                source: {
                    account_id: 'jack@generaltask.com',
                    name: 'Jack Hamilton',
                    logo: '',
                    logo_v2: 'gmail',
                    is_completable: false,
                    is_replyable: false,
                },
                is_archived: false,
                emails: [
                    {
                        message_id: '62bf6d62780ba686a617f2e9',
                        subject: 'Blah blah blah email!!! (jack@generaltask.com)',
                        body: '<span itemscope itemtype="http://schema.org/InformAction"><span style="display:none" itemprop="about" itemscope itemtype="http://schema.org/Person"><meta itemprop="description" content="John Reinstra accepted"/></span><span itemprop="object" itemscope itemtype="http://schema.org/Event"><div style=""><table cellspacing="0" cellpadding="8" border="0" summary="" style="width:100%;font-family:Arial,Sans-serif;border:1px Solid #ccc;border-width:1px 2px 2px 1px;background-color:#fff;"><tr><td><div style="padding:6px 10px;margin:0 0 4px 0;font-family:Arial,Sans-serif;font-size:13px;line-height:1.4;border:1px Solid #ccc;background:#ffc;color:#222"><strong><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">John Reinstra</span><meta itemprop="email" content="john@generaltask.com"/></span> has accepted this invitation.</strong></div><div style="padding:2px"><span itemprop="publisher" itemscope itemtype="http://schema.org/Organization"><meta itemprop="name" content="Google Calendar"/></span><meta itemprop="eventId/googleCalendar" content="294ca8qer3ahtm6flqvfv6ufgj"/><h3 style="padding:0 0 6px 0;margin:0;font-family:Arial,Sans-serif;font-size:16px;font-weight:bold;color:#222"><span itemprop="name">Private room at 801 Chophouse</span></h3><table style="display:inline-table" cellpadding="0" cellspacing="0" border="0" summary="Event details"><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">When</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><time itemprop="startDate" datetime="20220714T231500Z"></time><time itemprop="endDate" datetime="20220715T011500Z"></time>Thu Jul 14, 2022 4:15pm – 6:15pm <span style="color:#888">Pacific Time - Los Angeles</span></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Where</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span itemprop="location" itemscope itemtype="http://schema.org/Place"><span itemprop="name" class="notranslate">137 Carondelet Plaza, Clayton, MO 63105, USA</span><span dir="ltr"> (<a href="https://www.google.com/maps/search/137+Carondelet+Plaza,+Clayton,+MO+63105,+USA?hl=en" style="color:#20c;white-space:nowrap" target="_blank" itemprop="map">map</a>)</span></span></td></tr><tr><td style="padding:0 1em 4px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Joining info</i></div></td><td style="padding-bottom:4px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">Join with Google Meet</td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span itemprop="potentialaction" itemscope itemtype="http://schema.org/JoinAction"><span itemprop="name" content="meet.google.com/uiu-bqvd-bys"><span itemprop="target" itemscope itemtype="http://schema.org/EntryPoint"><span itemprop="url" content="https://meet.google.com/uiu-bqvd-bys?hs=224"><span itemprop="httpMethod" content="GET"><a href="https://meet.google.com/uiu-bqvd-bys?hs=224" style="color:#20c;white-space:nowrap" target="_blank">meet.google.com/uiu-bqvd-bys</a></span></span></span></span></span> </td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"></td></tr><td style="padding:0 1em 4px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:4px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">Join by phone</td><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><span style="color:#888">(US) </span><a href="tel:+1-678-567-4823%3B363214567%23" style="color:#20c;white-space:nowrap" target="_blank">+1 678-567-4823</a> <span style="color:#888">(PIN: 363214567)</span></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap"></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><a href="https://tel.meet/uiu-bqvd-bys?pin=7261788975958&hs=0" style="color:#20c;white-space:nowrap" target="_blank">More phone numbers</a></td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Calendar</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top">jack@generaltask.com</td></tr><tr><td style="padding:0 1em 10px 0;font-family:Arial,Sans-serif;font-size:13px;color:#888;white-space:nowrap" valign="top"><div><i style="font-style:normal">Who</i></div></td><td style="padding-bottom:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222" valign="top"><table cellspacing="0" cellpadding="0"><tr><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><span style="font-family:Courier New,monospace">&#x2022;</span></td><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><div><div style="margin:0 0 0.3em 0"><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">jack@generaltask.com</span><meta itemprop="email" content="jack@generaltask.com"/></span><span itemprop="organizer" itemscope itemtype="http://schema.org/Person"><meta itemprop="name" content="jack@generaltask.com"/><meta itemprop="email" content="jack@generaltask.com"/></span><span style="font-size:11px;color:#888"> - organizer</span></div></div></td></tr><tr><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><span style="font-family:Courier New,monospace">&#x2022;</span></td><td style="padding-right:10px;font-family:Arial,Sans-serif;font-size:13px;color:#222"><div><div style="margin:0 0 0.3em 0"><span itemprop="attendee" itemscope itemtype="http://schema.org/Person"><span itemprop="name" class="notranslate">john@generaltask.com</span><meta itemprop="email" content="john@generaltask.com"/></span></div></div></td></tr></table></td></tr></table></div></td></tr><tr><td style="background-color:#f6f6f6;color:#888;border-top:1px Solid #ccc;font-family:Arial,Sans-serif;font-size:11px"><p>Invitation from <a href="https://calendar.google.com/calendar/" target="_blank" style="">Google Calendar</a></p><p>You are receiving this email at the account jack@generaltask.com because you are subscribed for invitation replies on calendar jack@generaltask.com.</p><p>To stop receiving these emails, please log in to https://calendar.google.com/calendar/ and change your notification settings for this calendar.</p><p>Forwarding this invitation could allow any recipient to send a response to the organizer and be added to the guest list, or invite others regardless of their own invitation status, or to modify your RSVP. <a href="https://support.google.com/calendar/answer/37135#forwarding">Learn More</a>.</p></td></tr></table></div></span></span>',
                        sent_at: '2022-07-01T21:24:16.000Z',
                        is_unread: false,
                        sender: {
                            name: 'John Reinstra',
                            email: 'john@generaltask.com',
                            reply_to: 'John Reinstra <john@generaltask.com>',
                        },
                        recipients: {
                            to: [
                                {
                                    name: '',
                                    email: 'jack@generaltask.com'
                                }
                            ],
                            cc: [],
                            bcc: [],
                        },
                        num_attachments: 2
                    }
                ],
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

    return { data: views, isLoading: false, temporaryReorderViews }
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

