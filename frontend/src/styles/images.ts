export const logos: { [key: string]: string } = {
    generaltask: '/images/generaltask.png',
    generaltask_gray: '/images/generaltask_gray.png',
    asana: '/images/asana.png',
    asana_gray: '/images/asana_gray.png',
    github: '/images/github.png',
    gmail: '/images/gmail.png',
    gmail_gray: '/images/gmail_gray.png',
    gcal: '/images/gcal.png',
    gcal_gray: '/images/gcal_gray.png',
    google_meet: '/images/google-meet.svg',
    linear: '/images/linear.png',
    slack: '/images/slack.png',
}

export const icons = Object.freeze({
    archive_purple: '/images/archive_purple.svg',
    archive: '/images/archive.png',
    arrows_in: '/images/arrows_in.png',
    arrows_out: '/images/arrows_out.png',
    attachment: '/images/attachment.svg',
    calendar_blank: '/images/calendar_blank.png',
    caret_down: '/images/caret_down.svg',
    caret_left: '/images/caret_left.png',
    caret_right: '/images/caret_right.png',
    caret_right_purple: '/images/caret_right_purple.png',
    check_circle_wavy: '/images/check_circle_wavy.png',
    check_gray: '/images/check_gray.png',
    check_unchecked: '/images/check_unchecked.png',
    chevron_up: '/images/chevron_up.png',
    chevron_down: '/images/chevron_down.png',
    copy: '/images/copy.svg',
    dot: '/images/dot.svg',
    external_link: '/images/external_link.svg',
    forward: '/images/forward.svg',
    gear: '/images/gear.png',
    inbox: '/images/inbox.png',
    inbox_purple: '/images/inbox_purple.png',
    label: '/images/label.png',
    list: '/images/list.svg',
    mark_as_task: '/images/mark_as_task.png',
    mark_as_task_active: '/images/mark_as_task_active.png',
    mark_read: '/images/mark_read.svg',
    mark_unread: '/images/mark_unread.svg',
    message_to_task: '/images/message_to_task.svg',
    messages: '/images/messages.png',
    plus: '/images/plus.svg',
    pencil: '/images/pencil.png',
    reply: '/images/reply.svg',
    replyAll: '/images/reply-all.svg',
    repository: '/images/repository.svg',
    skinnyHamburger: '/images/skinny_hamburger.svg',
    speechBubble: '/images/speech_bubble.svg',
    spinner: '/images/spinner.svg',
    task_complete: '/images/task_complete.png',
    task_incomplete: '/images/task_incomplete.png',
    timer: '/images/timer.png',
    trash: '/images/trash.png',
    x_thin: '/images/x_thin.svg',
    x: '/images/x.svg',
})

export const buttons: { [key: string]: string } = {
    google_sign_in: '/images/google_sign_in.png',
}

export const linearStatus = Object.freeze({
    backlog: '/images/linear_backlog.svg',
    unstarted: '/images/linear_todo.svg',
    started: '/images/linear_inprogress.svg',
    completed: '/images/linear_done.svg',
    canceled: '/images/linear_canceled.svg',

    inreview: '/images/linear_inreview.svg',
    triage: '/images/linear_triage.svg',
    duplicate: '/images/linear_duplicate.svg',
})

export type TLogoImage = keyof typeof logos
export type TIconImage = keyof typeof icons
export type TLinearStatusImage = keyof typeof linearStatus
