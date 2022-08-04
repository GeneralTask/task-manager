export const logos: { [key: string]: string } = {
    generaltask: '/images/generaltask.svg',
    generaltask_gray: '/images/generaltask_gray.svg',
    asana: '/images/asana.svg',
    asana_gray: '/images/asana_gray.svg',
    github: '/images/github.svg',
    github_gray: '/images/github_gray.svg',
    gmail: '/images/gmail.svg', // TODO: remove when backend sends "google" instead of "gmail" for linked google accounts
    gcal: '/images/gcal.png', //missing svg
    gcal_gray: '/images/gcal_gray.svg',
    google_meet: '/images/google-meet.svg',
    linear: '/images/linear.png', //missing svg
    slack: '/images/slack.svg',
}

export const icons = Object.freeze({
    arrows_in: '/images/arrows_in.svg',
    arrows_out: '/images/arrows_out.svg',
    calendar_blank: '/images/calendar_blank.svg',
    calendar_blank_dark: '/images/calendar_blank_dark.svg', 
    caret_down: '/images/caret_down.svg',
    caret_left: '/images/caret_left.svg',
    caret_right: '/images/caret_right.svg',
    caret_right_purple: '/images/caret_right_purple.svg',
    caret_right_sidebar: '/images/caret_right_sidebar.svg',
    check_circle_wavy: '/images/check_circle_wavy.svg',
    check_gray: '/images/check_gray.svg',
    check_unchecked: '/images/check_unchecked.svg',
    chevron_down: '/images/chevron_down.svg',
    copy: '/images/copy.svg',
    dot: '/images/dot.svg',
    exit: '/images/exit.svg', 
    external_link: '/images/external_link.svg',
    external_link_dark: '/images/external_link_dark.svg',
    gear: '/images/gear.svg',
    inbox: '/images/inbox.svg',
    inbox_purple: '/images/inbox_purple.svg',
    label: '/images/label.svg',
    list: '/images/list.svg',
    plus: '/images/plus.svg',
    pencil: '/images/pencil.svg',
    repository: '/images/repository.svg',
    skinnyHamburger: '/images/skinny_hamburger.svg',
    speechBubble: '/images/speech_bubble.svg',
    spinner: '/images/spinner.svg',
    task_complete: '/images/task_complete.svg',
    task_incomplete: '/images/task_incomplete.svg',
    timer: '/images/timer.svg',
    trash: '/images/trash.svg',
    trash_gray: '/images/trash_gray.svg', 
    x_thin: '/images/x_thin.svg',
    x: '/images/x.svg',
})

export const buttons: { [key: string]: string } = {
    google_sign_in: '/images/google_sign_in.png', //missing svg
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
