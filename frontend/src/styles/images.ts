import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faGithub, faGoogle, faSlack } from '@fortawesome/free-brands-svg-icons'
import { faArrowDownLeftAndArrowUpRightToCenter, faArrowUpRightAndArrowDownLeftFromCenter, faArrowUpRightFromSquare, faBadgeCheck, faBars, faCalendar, faCheckSquare, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCircleSmall, faComment, faCopy, faCubes, faFolder, faGear, faInbox, faList, faPencil, faPlus, faSpinner, faSquare, faTag, faTimer, faTrash, faXmark } from '@fortawesome/pro-light-svg-icons'

export const logos: { [key: string]: IconDefinition } = {
    generaltask: faSquare,  // missing icon
    github: faGithub,
    gmail: faGoogle,
    gcal: faGoogle,         // missing icon
    google_meet: faGoogle,  // missing icon
    linear: faSquare,       // missing icon
    slack: faSlack,
}

export const icons = Object.freeze({
    arrows_in: faArrowDownLeftAndArrowUpRightToCenter,
    arrows_out: faArrowUpRightAndArrowDownLeftFromCenter,
    calendar_blank: faCalendar,
    caret_down: faChevronDown,
    caret_left: faChevronLeft,
    caret_right: faChevronRight,
    caret_up: faChevronUp,
    check_circle_wavy: faBadgeCheck,
    check: faCheckSquare,
    check_unchecked: faSquare,
    copy: faCopy,
    dot: faCircleSmall,
    external_link: faArrowUpRightFromSquare,
    folder: faFolder,
    gear: faGear,
    inbox: faInbox,
    label: faTag,
    list: faList,
    plus: faPlus,
    pencil: faPencil,
    repository: faCubes,
    hamburger: faBars,
    comment: faComment,
    spinner: faSpinner,
    timer: faTimer,
    trash: faTrash,
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

export type TLogoImage = keyof typeof logos
export type TIconImage = keyof typeof icons
export type TLinearStatusImage = keyof typeof linearStatus
