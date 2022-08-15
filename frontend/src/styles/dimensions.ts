export const iconSize = {
    xxSmall: '10px',
    xSmall: '15px',
    small: '20px',
    medium: '30px',
    large: '40px',
}

export type TIconSize = keyof typeof iconSize

export const checkboxSize = {
    childContainer: '40px',
    parentContainer: '20px',
}

export const modalSize = {
    dialog: {
        max_height: '200px',
        min_height: 'fit-content',
        width: 'fit-content',
    },
    small: {
        max_height: '440px',
        min_height: '440px',
        width: '478px',
    },
    medium: {
        max_height: '620px',
        min_height: '620px',
        width: '723px',
    },
}

export type TModalSize = keyof typeof modalSize

export const MEDIA_MAX_WIDTH = '650px'
export const WINDOW_MIN_WIDTH = '800px'
export const NAVIGATION_BAR_WIDTH = '230px'
export const TASK_ACTION_WIDTH = '200px'
export const DEFAULT_VIEW_WIDTH = '480px'
export const TASK_HEIGHT = '48px'
