export const iconSize = {
    xxSmall: 10,
    xSmall: 15,
    small: 20,
    medium: 30,
    large: 40,
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

export type TModalSize = keyof typeof modalSize

export const MEDIA_MAX_WIDTH = '650px'
export const WINDOW_MIN_WIDTH = '800px'
export const NAVIGATION_BAR_WIDTH = '230px'
export const TASK_ACTION_WIDTH = '200px'
export const DEFAULT_VIEW_WIDTH = '480px'
export const TASK_HEIGHT = '36px'
