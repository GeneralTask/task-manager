const white = '#FFFFFF'
const black = '#000000'
const gray = {
    light: '#FAFAFA',
    midlight: '#F4F4F4',
    middark: '#DADADA',
    dark: '#717179',
    transparent: '#D9D9D980',
}
const red = {
    default: '#FF135A',
    light: '#FFE7EE',
}
const orange = {
    default: '#FF8213',
    light: '#FFF2E7',
}
const yellow = {
    default: '#FFBA0D',
    light: '#FFF8E7',
}
const green = {
    default: '#00A538',
    light: '#E5F6EB',
}
const cyan = {
    default: '#00CBD8',
    light: '#E5FAFB',
}
const blue = {
    default: '#25BEFF',
    light: '#E9F8FF',
}
const purple = {
    default: '#5634CF',
    accent: '#452AA5',
    light: '#EEEBFA',
}


export const background = {
    white: white,
    light: gray.light,
    mid: gray.midlight,
    dark: gray.middark,
    black: black,
    modalOverlay: gray.transparent,
}

export const text = {
    black: black,
    light: gray.dark,
    white: white,
}

export const button = {
    primary: {
        default: purple.default,
        hover: purple.accent,
        active_text: gray.middark,
    },
    secondary: {
        default: white,
        hover: gray.midlight,
        active_text: black,
    },
}

export const status = {
    red: { default: red.default, light: red.light },
    orange: { default: orange.default, light: orange.light },
    yellow: { default: yellow.default, light: yellow.light },
    green: { default: green.default, light: green.light },
    cyan: { default: cyan.default, light: cyan.light },
    blue: { default: blue.default, light: blue.light },
    gray: { default: gray.dark, light: gray.middark },
}
export type TStatusColors = keyof typeof status

export const gtColor = {
    primary: purple.default,
    secondary: purple.light,
}
