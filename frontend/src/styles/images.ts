import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
import {
    faArrowDown,
    faArrowDownLeftAndArrowUpRightToCenter,
    faArrowRotateRight,
    faArrowUp,
    faArrowUpRightAndArrowDownLeftFromCenter,
    faArrowUpRightFromSquare,
    faCalendar,
    faCalendarDays,
    faCheck,
    faCheckSquare,
    faFolder,
    faMagnifyingGlass,
    faMessage,
    faPencil,
    faPlus,
    faSquare,
    faTrash,
    faXmark,
    faBadgeCheck,
    faBars,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCircleSmall,
    faCopy,
    faCubes,
    faGear,
    faGripDotsVertical,
    faInbox,
    faList,
    faTag,
    faTimer,

} from '@fortawesome/pro-light-svg-icons'
import {
    faMinus,
    faCircleUp,
    faCircleChevronUp,
    faCircleDot,
    faCircleChevronDown,
    faHeadphones
} from '@fortawesome/pro-solid-svg-icons'

export const logos = Object.freeze({
    generaltask: '/images/generaltask.svg',
    github: faGithub,
    gmail: faGoogle,
    gcal: '/images/gcal.png',
    google_meet: '/images/google-meet.svg',
    linear: '/images/linear.png',
    slack: '/images/slack.svg',
})

export const icons = Object.freeze({
    arrow_down: faArrowDown,
    arrow_up: faArrowUp,
    arrows_in: faArrowDownLeftAndArrowUpRightToCenter,
    arrows_out: faArrowUpRightAndArrowDownLeftFromCenter,
    calendar_blank: faCalendar,
    calendar_days: faCalendarDays,
    caret_down: faChevronDown,
    caret_left: faChevronLeft,
    caret_right: faChevronRight,
    caret_up: faChevronUp,
    check_circle_wavy: faBadgeCheck,
    check: faCheck,
    checkbox_checked: faCheckSquare,
    checkbox_unchecked: faSquare,
    copy: faCopy,
    dot: faCircleSmall,
    domino: faGripDotsVertical,
    external_link: faArrowUpRightFromSquare,
    folder: faFolder,
    gear: faGear,
    headphones: faHeadphones,
    inbox: faInbox,
    label: faTag,
    list: faList,
    magnifying_glass: faMagnifyingGlass,
    plus: faPlus,
    pencil: faPencil,
    repository: faCubes,
    hamburger: faBars,
    comment: faMessage,
    spinner: faArrowRotateRight,
    timer: faTimer,
    trash: faTrash,
    x: faXmark,
    priority_urgent: faCircleUp,
    priority_low: faCircleChevronDown,
    priority_medium: faCircleDot,
    priority_high: faCircleChevronUp,
    priority_none: faMinus,
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

export const focusModeBackground = '/images/focus_mode_background.jpg'

export type TLogoImage = keyof typeof logos
export type TIconImage = keyof typeof icons
export type TLinearStatusImage = keyof typeof linearStatus
