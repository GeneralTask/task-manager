export const iconSize = {
    xxSmall: '10px',
    xSmall: '15px',
    small: '20px',
    medium: '30px',
    large: '40px',
}

export type TIconSize = keyof typeof iconSize

export const modalSize = {
    small: {
        width: '478px',
        height: '440px',
    },
    medium: {
        width: '723px',
        height: '620px',
    },
}

export const modalTemplateSize = {
    dialog: {
        max_height: '75vh',
        min_height: 'fit-content',
        width: 'fit-content',
    },
    default: {
        max_height: '75vh',
        min_height: '50vh',
        width: '50vw',
    },
}

export type TModalSize = keyof typeof modalSize

export const MEDIA_MAX_WIDTH = '650px'
export const WINDOW_MIN_WIDTH = '800px'
export const NAVIGATION_BAR_WIDTH = '230px'
export const TASK_ACTION_WIDTH = '200px'
export const DEFAULT_VIEW_WIDTH = '480px'
export const TASK_HEIGHT = '36px'
