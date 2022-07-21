const WHITE = '#FFFFFF'
const BLACK = '#000000'
const GRAY = {
    light: '#FAFAFA',
    mediumLight: '#F4F4F4',
    mediumDark: '#DADADA',
    dark: '#717179',
    transparentDark: '#D9D9D980',
}
const RED = {
    default: '#FF135A',
    light: '#FFE7EE',
}
const ORANGE = {
    default: '#FF8213',
    light: '#FFF2E7',
}
const YELLOW = {
    default: '#FFBA0D',
    light: '#FFF8E7',
}
const GREEN = {
    default: '#00A538',
    light: '#E5F6EB',
}
const CYAN = {
    default: '#00CBD8',
    light: '#E5FAFB',
}
const BLUE = {
    default: '#25BEFF',
    light: '#E9F8FF',
}
const PURPLE = {
    default: '#5634CF',
    accent: '#452AA5',
    light: '#EEEBFA',
}


export const background = {
    white: WHITE,
    light: GRAY.light,
    medium: GRAY.mediumLight,
    dark: GRAY.mediumDark,
    black: BLACK,
    modalOverlay: GRAY.transparentDark,
}

export const text = {
    black: BLACK,
    light: GRAY.dark,
    white: WHITE,
}

export const button = {
    primary: {
        default: PURPLE.default,
        hover: PURPLE.accent,
        active_text: GRAY.mediumDark,
    },
    secondary: {
        default: WHITE,
        hover: GRAY.mediumLight,
        active_text: BLACK,
    },
}

export const status = {
    red: { default: RED.default, light: RED.light },
    orange: { default: ORANGE.default, light: ORANGE.light },
    yellow: { default: YELLOW.default, light: YELLOW.light },
    green: { default: GREEN.default, light: GREEN.light },
    cyan: { default: CYAN.default, light: CYAN.light },
    blue: { default: BLUE.default, light: BLUE.light },
    gray: { default: GRAY.dark, light: GRAY.mediumDark },
}
export type TStatusColors = keyof typeof status

export const gtColor = {
    primary: PURPLE.default,
    secondary: PURPLE.light,
}
