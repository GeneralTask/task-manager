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
    faArrowsRepeat,
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
    faDiagramSubtask,
    faEllipsisVertical,
    faFlask,
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
    faMegaphone,
    faMessage,
    faNoteSticky,
    faPencil,
    faPlus,
    faShare,
    faSidebar,
    faSidebarFlip,
    faSquare,
    faSquareCode,
    faStrikethrough,
    faTag,
    faTimer,
    faTrash,
    faUnderline,
    faUser,
    faVideo,
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
    generaltask_single_color: 'images/gt-logo-single-color.svg',
    generaltask: '/images/generaltask.svg',
    generaltask_beta: '/images/GT-beta-logo.png',
    generaltask_yellow_circle: '/images/gt-logo-yellow-circle.png',
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
    arrows_repeat: faArrowsRepeat,
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
    ellipsisVertical: faEllipsisVertical,
    external_link: faArrowUpRightFromSquare,
    filter: faBarsFilter,
    flask: faFlask,
    folder: faFolder,
    gear: faGear,
    github_high: '/images/github_high.svg',
    github_low: '/images/github_low.svg',
    github_med: '/images/github_med.svg',
    github_paused: '/images/github_paused.svg',
    github: logos.github,
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
    megaphone: faMegaphone,
    note: faNoteSticky,
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
    share: faShare,
    sidebar: faSidebar,
    sidebarFlipped: faSidebarFlip,
    slack: logos.slack,
    sort: faBarsSort,
    spinner: faArrowRotateRight,
    strikethrough: faStrikethrough,
    subtask: faDiagramSubtask,
    timer: faTimer,
    trash: faTrash,
    underline: faUnderline,
    user: faUser,
    video: faVideo,
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
export const noteBackground = '/images/note_background.jpg'

export type TLogoImage = keyof typeof logos
export type TIconImage = keyof typeof icons
export type TLinearStatusImage = keyof typeof linearStatus
