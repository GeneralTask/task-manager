import store from '../redux/store'

const WHITE = '#FFFFFF'
const BLACK = '#000000'
const GRAY = {
    _50: '#FAFAFA',
    _100: '#F4F4F4',
    _200: '#DADADA',
    _500: '#717179',
    _600: '#6E6E70',
    _700: '#6A6A6B',
    _800: '#666667',
    _900: '#4A4A4B',
    _1000: '#3D3D3E',
    _1100: '#353536',
    _1200: '#2F2F30',
    _1300: '#29292A',
    _1400: '#242425',
    _1500: '#1F1F20',
    _1600: '#1A1A1B',
}
const RED = {
    _1: '#FF135A',
    _2: '#FFE7EE',
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
    _1: '#00A538',
    _2: '#E5F6EB',
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
    _3: '#452AA5',
}


const darkMode = store.getState().local.dark_mode

export const background = {
    white: darkMode ? GRAY._1200 : WHITE,
    light: darkMode ? GRAY._1300 : GRAY._50,
    medium: darkMode ? GRAY._1400 : GRAY._100,
    dark: darkMode ? GRAY._1500 : GRAY._200,
    black: darkMode ? GRAY._1600 : BLACK,
}

export const border = {
    light: darkMode ? GRAY._1200 : GRAY._200,
    gray: darkMode ? GRAY._1400 : GRAY._500,
}

export const text = {
    black: darkMode ? GRAY._200 : BLACK,
    light: GRAY._500,
    white: darkMode ? BLACK : WHITE,
}

export const icon = {
    white: WHITE,
    gray: GRAY._500,
    red: RED._1,
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
        default: darkMode ? GRAY._1000 : WHITE,
        hover: darkMode ? GRAY._1200 : GRAY._200,
        active_text: darkMode ? WHITE : BLACK,
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
