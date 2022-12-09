import { TShortcut, TShortcutCategory } from '../utils/types'

const IS_MAC_OS = navigator.userAgent.includes('Mac')

const CMD_CTRL = {
    key: IS_MAC_OS ? 'Meta' : 'Ctrl',
    label: IS_MAC_OS ? '⌘' : 'Ctrl',
}
const OPT_ALT = {
    key: IS_MAC_OS ? 'Alt' : 'Alt',
    label: IS_MAC_OS ? '⌥' : 'Alt',
}

const SHIFT = 'Shift'
const NO_SHORTCUT = ''

// command palette categories will be sorted in the order they appear in this array
export const ShortcutCategories: TShortcutCategory[] = ['Tasks', 'Calendar', 'General', 'Navigation']

/* 
    * NOTE: This allows KEYBOARD_SHORTCUTS to be type-checked while also allowing the editor to autocomplete the keys.
    * Sourced from: https://stackoverflow.com/a/52157355/12679075

*/
const asShortcuts = <T extends { [key: string]: Omit<TShortcut, 'action'> }>(arg: T): T => arg

const KEYBOARD_SHORTCUTS = asShortcuts({
    // Task shortcuts
    backToParentTask: {
        label: 'Back to parent task',
        key: 'Escape',
        keyLabel: 'Esc',
        category: 'Tasks',
        icon: 'arrow_left',
    },
    createTask: {
        label: 'Create new task',
        key: 'c',
        keyLabel: 'C',
        category: 'Tasks',
        icon: 'plus',
    },
    createSubtask: {
        label: 'Create new subtask',
        key: `${SHIFT}+C`,
        keyLabel: `${SHIFT}+C`,
        category: 'Tasks',
        icon: 'plus',
    },
    createFolder: {
        label: 'Create new folder',
        key: `${SHIFT}+F`,
        keyLabel: `${SHIFT}+F`,
        category: 'Tasks',
        icon: 'plus',
    },
    deleteTask: {
        label: 'Delete this task',
        key: `${SHIFT}+Backspace`,
        keyLabel: `${SHIFT}+Backspace`,
        category: 'Tasks',
        icon: 'trash',
    },
    markAsDone: {
        label: 'Mark as done',
        key: `${SHIFT}+D`,
        keyLabel: `${SHIFT}+D`,
        category: 'Tasks',
        icon: 'check',
    },
    editTaskName: {
        label: 'Edit task name',
        key: 'e',
        keyLabel: 'E',
        category: 'Tasks',
        icon: 'pencil',
    },
    moveTaskToFolder: {
        label: 'Move task to folder',
        key: `${SHIFT}+M`,
        keyLabel: `${SHIFT}+M`,
        category: 'Tasks',
        icon: 'folder',
    },
    submitComment: {
        label: 'Submit comment',
        key: `${CMD_CTRL.key}+Enter`,
        keyLabel: `${CMD_CTRL.label}+Enter`,
        category: 'Tasks',
        icon: 'comment',
        hideFromCommandPalette: true,
    },
    navigationView: {
        label: 'Show/hide navigation view',
        key: '[',
        keyLabel: '[',
        category: 'Navigation',
        icon: 'sidebar',
    },
    // Calendar shortcuts
    calendar: {
        label: 'Show/hide calendar',
        key: ']',
        keyLabel: ']',
        category: 'Calendar',
        icon: 'calendar_blank',
    },
    showDailyCalendar: {
        label: 'Show daily calendar',
        key: 'd',
        keyLabel: 'D',
        category: 'Calendar',
        icon: 'calendar_blank',
    },
    showWeeklyCalendar: {
        label: 'Show weekly calendar',
        key: 'w',
        keyLabel: 'W',
        category: 'Calendar',
        icon: 'calendar_blank',
    },
    deleteCalendarEvent: {
        label: 'Delete calendar event',
        key: 'Backspace',
        keyLabel: 'Backspace',
        category: 'Calendar',
        icon: 'trash',
    },
    nextDate: {
        label: 'Next day',
        key: 'n',
        keyLabel: 'N',
        category: 'Calendar',
        icon: 'caret_right',
    },
    previousDate: {
        label: 'Previous day',
        key: 'p',
        keyLabel: 'P',
        category: 'Calendar',
        icon: 'caret_left',
    },
    jumpToToday: {
        label: 'Schedule tasks',
        key: 's',
        keyLabel: 'S',
        category: 'Calendar',
        icon: 'calendar_blank',
    },
    scheduleTasks: {
        label: 'Jump to Today',
        key: 't',
        keyLabel: 'T',
        category: 'Calendar',
        icon: 'calendar_blank',
    },
    // Navigation shortcuts
    arrowUp: {
        label: 'Previous item',
        key: 'ArrowUp',
        keyLabel: '↑',
        category: 'Navigation',
        icon: 'arrow_up',
    },
    arrowDown: {
        label: 'Next item',
        key: 'ArrowDown',
        keyLabel: '↓',
        category: 'Navigation',
        icon: 'arrow_down',
    },
    up: {
        label: 'Previous item',
        key: 'k',
        keyLabel: 'K',
        category: 'Navigation',
        hideFromCommandPalette: true,
    },
    down: {
        label: 'Next item',
        key: 'j',
        keyLabel: 'J',
        category: 'Navigation',
        hideFromCommandPalette: true,
    },
    refresh: {
        label: 'Refresh',
        key: `®`,
        keyLabel: `${OPT_ALT.label}+R`,
        category: 'Navigation',
        icon: 'spinner',
    },
    toggleCommandPalette: {
        label: 'Show/hide command palette',
        key: `${CMD_CTRL.key}+k`,
        keyLabel: `${CMD_CTRL.label}+K`,
        category: 'Navigation',
        hideFromCommandPalette: true,
    },
    closeCommandPalette: {
        label: 'Close command palette',
        key: 'Escape',
        keyLabel: 'Esc',
        category: 'Navigation',
        hideFromCommandPalette: true,
    },
    close: {
        label: 'Close',
        key: 'Escape',
        keyLabel: 'Esc',
        category: 'Navigation',
        icon: 'x',
    },
    enterFocusMode: {
        label: 'Enter Focus Mode',
        key: 'f',
        keyLabel: 'F',
        category: 'Navigation',
        icon: 'headphones',
    },
    goToOverviewPage: {
        label: 'Go to Overview page',
        key: `${OPT_ALT.key}+${SHIFT}+O`,
        keyLabel: `${OPT_ALT.label}+${SHIFT}+O`,
        category: 'Navigation',
        icon: 'list',
    },
    goToGithubPRsPage: {
        label: 'Go to GitHub page',
        key: `${OPT_ALT.key}+${SHIFT}+G`,
        keyLabel: `${OPT_ALT.label}+${SHIFT}+G`,
        category: 'Navigation',
        icon: 'github',
    },
    goToLinearPage: {
        label: 'Go to Linear page',
        key: `${OPT_ALT.key}+${SHIFT}+L`,
        keyLabel: `${OPT_ALT.label}+${SHIFT}+L`,
        category: 'Navigation',
        icon: 'linear',
    },
    goToSlackPage: {
        label: 'Go to Slack page',
        key: `${OPT_ALT.key}+${SHIFT}+S`,
        keyLabel: `${OPT_ALT.label}+${SHIFT}+S`,
        category: 'Navigation',
        icon: 'slack',
    },
    goToTaskInbox: {
        label: 'Go to Task Inbox',
        key: `${OPT_ALT.key}+${SHIFT}+I`,
        keyLabel: `${OPT_ALT.label}+${SHIFT}+I`,
        category: 'Navigation',
        icon: 'inbox',
    },
    // General shortcuts
    dismissNotifications: {
        label: 'Dismiss notifications',
        key: 'x',
        keyLabel: 'X',
        category: 'General',
        icon: 'x',
    },
    joinCurrentMeeting: {
        label: 'Join current meeting',
        key: 'm',
        keyLabel: 'M',
        category: 'General',
        icon: 'video',
    },
    sendFeedback: {
        label: 'Send us feedback',
        key: NO_SHORTCUT,
        keyLabel: NO_SHORTCUT,
        category: 'General',
        icon: 'megaphone',
    },
})

export type TShortcutName = keyof typeof KEYBOARD_SHORTCUTS

export default KEYBOARD_SHORTCUTS
