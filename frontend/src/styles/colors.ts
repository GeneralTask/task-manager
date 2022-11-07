const WHITE = '#FFFFFF'
const BLACK = '#000000'
const GRAY = {
    _50: '#FAFAFA',
    _100: '#F4F4F4',
    _200: '#DADADA',
    _500: '#717179',
}
const RED = {
    _1: '#E24858',
    _2: '#F6C8CD',
}
const ORANGE = {
    _1: '#ee7600',
    _2: '#ff6700',
}
const YELLOW = {
    _1: '#FFBA0D',
    _2: '#FFEAB6',
}
const GREEN = {
    _1: '#41802E',
    _2: '#CFDFCB',
}
const BLUE = {
    _1: '#25BEFF',
    _2: '#BEEBFF',
}
const PURPLE = {
    _1: '#5634CF',
    _2: '#EEEBFA',
    _3: '#E1D7FD33', // NOT IN DESIGN DOC (only used for drop indicator)
}

export const background = {
    white: WHITE,
    light: GRAY._50,
    medium: GRAY._100,
    dark: GRAY._200,
    black: BLACK,
    dropIndicator: PURPLE._3,
}

export const border = {
    extra_light: GRAY._100,
    light: GRAY._200,
    gray: GRAY._500,
    purple: PURPLE._1,
}

export const text = {
    black: BLACK,
    light: GRAY._500,
    white: WHITE,
    orange: ORANGE._1,
    green: GREEN._1,
    red: RED._1,
    purple: PURPLE._1,
}
export type TTextColor = keyof typeof text

export const icon = {
    white: WHITE,
    gray: GRAY._500,
    red: RED._1,
    yellow: YELLOW._1,
    blue: BLUE._1,
    green: GREEN._1,
    orange: ORANGE._1,
    purple: PURPLE._1,
    black: BLACK,
}
export type TIconColor = keyof typeof icon

export const button = {
    primary: {
        default: ORANGE._1,
        hover: `linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), ${ORANGE._1}`,
        active_text: GRAY._200,
    },
    secondary: {
        default: WHITE,
        hover: GRAY._200,
        active_text: BLACK,
    },
}

export const status = {
    red: { default: RED._1, light: RED._2 },
    yellow: { default: YELLOW._1, light: YELLOW._2 },
    green: { default: GREEN._1, light: GREEN._2 },
    gray: { default: GRAY._500, light: GRAY._200 },
}
export type TStatusColors = keyof typeof status

export const gtColor = {
    primary: ORANGE._1,
    secondary: ORANGE._2,
}
