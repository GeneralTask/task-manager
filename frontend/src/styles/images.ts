import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
    faArrowDown,
    faArrowDownLeftAndArrowUpRightToCenter,
    faArrowLeft,
    faArrowRight,
    faArrowRotateRight,
    faArrowUp,
    faArrowUpRightAndArrowDownLeftFromCenter,
    faArrowUpRightFromSquare,
    faBadgeCheck,
    faBars,
    faBarsFilter,
    faBarsSort,
    faCalendar,
    faCalendarDays,
    faCheck,
    faCheckSquare,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCircleExclamation,
    faCircleSmall,
    faCircleUp as faCircleUpLight,
    faClock,
    faCode,
    faCopy,
    faCubes,
    faFolder,
    faGear,
    faGlobe,
    faGripDotsVertical,
    faInbox,
    faItalic,
    faLink,
    faList,
    faListOl,
    faListUl,
    faMagnifyingGlass,
    faMessage,
    faPencil,
    faPlus,
    faSidebarFlip,
    faSquare,
    faSquareCode,
    faStrikethrough,
    faTag,
    faTimer,
    faTrash,
    faUnderline,
    faUser,
    faXmark,
} from '@fortawesome/pro-light-svg-icons'
import {
    faBold,
    faCaretDown,
    faCheckSquare as faCheckSquareSolid,
    faCircleChevronDown,
    faCircleChevronUp,
    faCircleDot,
    faCircleUp,
    faHeadphones,
    faMinus,
    faQuoteRight,
} from '@fortawesome/pro-solid-svg-icons'

export const logos = Object.freeze({
    generaltask: '/images/generaltask.svg',
    generaltask_beta: '/images/GT-beta-logo.png',
    github: faGithub,
    gmail: '/images/google.svg',
    gcal: '/images/gcal.png',
    google_meet: '/images/google-meet.svg',
    linear: '/images/linear.png',
    slack: '/images/slack.svg',
})

export const icons = Object.freeze({
    arrow_down: faArrowDown,
    arrow_left: faArrowLeft,
    arrow_right: faArrowRight,
    arrow_up: faArrowUp,
    arrows_in: faArrowDownLeftAndArrowUpRightToCenter,
    arrows_out: faArrowUpRightAndArrowDownLeftFromCenter,
    bold: faBold,
    calendar_blank: faCalendar,
    calendar_days: faCalendarDays,
    caret_down_solid: faCaretDown,
    caret_down: faChevronDown,
    caret_left: faChevronLeft,
    caret_right: faChevronRight,
    caret_up: faChevronUp,
    check_circle_wavy: faBadgeCheck,
    check: faCheck,
    checkbox_checked_solid: faCheckSquareSolid,
    checkbox_checked: faCheckSquare,
    checkbox_unchecked: faSquare,
    clock: faClock,
    code_block: faSquareCode,
    code: faCode,
    comment: faMessage,
    copy: faCopy,
    domino: faGripDotsVertical,
    dot: faCircleSmall,
    external_link: faArrowUpRightFromSquare,
    filter: faBarsFilter,
    folder: faFolder,
    gear: faGear,
    github: logos.github,
    github_paused: '/images/github_paused.svg',
    github_low: '/images/github_low.svg',
    github_med: '/images/github_med.svg',
    github_high: '/images/github_high.svg',
    globe: faGlobe,
    hamburger: faBars,
    headphones: faHeadphones,
    inbox: faInbox,
    italic: faItalic,
    label: faTag,
    linear: logos.linear,
    link: faLink,
    list_ol: faListOl,
    list_ul: faListUl,
    list: faList,
    magnifying_glass: faMagnifyingGlass,
    pencil: faPencil,
    plus: faPlus,
    priority_high: faCircleChevronUp,
    priority_low: faCircleChevronDown,
    priority_medium: faCircleDot,
    priority_none: faMinus,
    priority_urgent: faCircleUp,
    priority: faCircleUpLight,
    quote_right: faQuoteRight,
    repository: faCubes,
    sidebar: faSidebarFlip,
    slack: logos.slack,
    sort: faBarsSort,
    spinner: faArrowRotateRight,
    strikethrough: faStrikethrough,
    timer: faTimer,
    trash: faTrash,
    underline: faUnderline,
    user: faUser,
    warning: faCircleExclamation,
    x: faXmark,
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
