import { TShortcut, TShortcutCategory } from '../utils/types'

const CMD_CTRL_KEY = navigator.userAgent.includes('Mac') ? 'Meta' : 'Ctrl'
const CMD_CTRL_KEY_LABEL = navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'

// command palette categories will be sorted in the order they appear in this array
export const ShortcutCategories: TShortcutCategory[] = ['Tasks', 'Calendar', 'Navigation']

/* 
    * NOTE: This allows KEYBOARD_SHORTCUTS to be type-checked while also allowing the editor to autocomplete the keys.
    * Sourced from: https://stackoverflow.com/a/52157355/12679075

*/
const asShortcuts = <T extends { [key: string]: Omit<TShortcut, 'action'> }>(arg: T): T => arg

const KEYBOARD_SHORTCUTS = asShortcuts({
    // Task shortcuts
    createTask: {
        label: 'Create new task',
        key: 'c',
        keyLabel: 'C',
        category: 'Tasks',
        icon: 'plus',
    },
    markComplete: {
        label: 'Mark as done',
        key: 'd',
        keyLabel: 'D',
        category: 'Tasks',
        icon: 'check',
    },
    select: {
        label: 'Select',
        key: 'Enter',
        keyLabel: 'Enter',
        category: 'Tasks',
    },
    showDatePicker: {
        label: 'Show date picker',
        key: 's',
        keyLabel: 'S',
        category: 'Tasks',
        icon: 'calendar_days',
    },
    showSectionEditor: {
        label: 'Change folder',
        key: 'l',
        keyLabel: 'L',
        category: 'Tasks',
        icon: 'folder',
    },
    showTimeEstimationPicker: {
        label: 'Show time estimate picker',
        key: 'f',
        keyLabel: 'F',
        category: 'Tasks',
    },
    submitComment: {
        label: 'Submit comment',
        key: CMD_CTRL_KEY + '+Enter',
        keyLabel: CMD_CTRL_KEY_LABEL + '+Enter',
        category: 'Tasks',
        icon: 'comment',
    },
    // Calendar shortcuts
    calendar: {
        label: 'Show/hide calendar',
        key: ']',
        keyLabel: ']',
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
    today: {
        label: 'Today',
        key: 't',
        keyLabel: 'T',
        category: 'Calendar',
        icon: 'calendar_blank',
    },
    // General navigation shortcuts
    arrowUp: {
        label: 'Previous item',
        key: 'ArrowUp',
        keyLabel: '↑',
        category: 'Navigation',
        hideFromCommandPalette: true,
    },
    arrowDown: {
        label: 'Next item',
        key: 'ArrowDown',
        keyLabel: '↓',
        category: 'Navigation',
        hideFromCommandPalette: true,
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
        key: CMD_CTRL_KEY + '+r',
        keyLabel: CMD_CTRL_KEY_LABEL + '+R',
        category: 'Navigation',
        icon: 'spinner',
    },
    toggleCommandPalette: {
        label: 'Show/hide command palette',
        key: CMD_CTRL_KEY + '+k',
        keyLabel: CMD_CTRL_KEY_LABEL + '+K',
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
})

export type TShortcutName = keyof typeof KEYBOARD_SHORTCUTS

export default KEYBOARD_SHORTCUTS
