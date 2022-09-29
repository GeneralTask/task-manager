const WHITE = '#FFFFFF'
const BLACK = '#000000'
const GRAY = {
    _50: '#FAFAFA',
    _100: '#F4F4F4',
    _200: '#DADADA',
    _500: '#717179',
}
const RED = {
    _1: '#C70000',
    _2: '#EEB3B3',
}
const ORANGE = {
    _1: '#FF8213',
    _2: '#FFF2E7',
}
const YELLOW = {
    _1: '#FFBA0D',
    _2: '#FFF8E7',
}
const GREEN = {
    _1: '#41802E',
    _2: '#C6D9C0',
}
const CYAN = {
    _1: '#00CBD8',
    _2: '#E5FAFB',
}
const BLUE = {
    _1: '#25BEFF',
    _2: '#E9F8FF',
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
    placeholder: GRAY._200,
    white: WHITE,
    orange: ORANGE._1,
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
    purple: PURPLE._1,
    black: BLACK,
}
export type TIconColor = keyof typeof icon

export const button = {
    primary: {
        default: PURPLE._1,
        hover: `linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), ${PURPLE._1}`,
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
    orange: { default: ORANGE._1, light: ORANGE._2 },
    yellow: { default: YELLOW._1, light: YELLOW._2 },
    green: { default: GREEN._1, light: GREEN._2 },
    cyan: { default: CYAN._1, light: CYAN._2 },
    blue: { default: BLUE._1, light: BLUE._2 },
    gray: { default: GRAY._500, light: GRAY._200 },
}
export type TStatusColors = keyof typeof status

export const gtColor = {
    primary: PURPLE._1,
    secondary: PURPLE._2,
}
