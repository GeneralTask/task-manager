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
    white: darkMode ? GRAY._1100 : WHITE,
    light: darkMode ? GRAY._1200 : GRAY._50,
    medium: darkMode ? GRAY._1300 : GRAY._100,
    dark: darkMode ? GRAY._1400 : GRAY._200,
    black: darkMode ? GRAY._1600 : BLACK,
}

export const border = {
    light: darkMode ? GRAY._1200 : GRAY._200,
    gray: darkMode ? GRAY._1400 : GRAY._500,
}

export const text = {
    black: darkMode ? GRAY._100 : BLACK,
    light: darkMode ? GRAY._200 : GRAY._500,
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
    red: { default: darkMode ? RED._2 : RED._1, light: darkMode ? RED._1 : RED._2 },
    orange: { default: darkMode ? ORANGE._2 : ORANGE._1, light: darkMode ? ORANGE._1 : ORANGE._2 },
    yellow: { default: darkMode ? YELLOW._2 : YELLOW._1, light: darkMode ? YELLOW._1 : YELLOW._2 },
    green: { default: darkMode ? GREEN._2 : GREEN._1, light: darkMode ? GREEN._1 : GREEN._2 },
    cyan: { default: darkMode ? CYAN._2 : CYAN._1, light: darkMode ? CYAN._1 : CYAN._2 },
    blue: { default: darkMode ? BLUE._2 : BLUE._1, light: darkMode ? BLUE._1 : BLUE._2 },
    gray: { default: darkMode ? GRAY._200 : GRAY._500, light: darkMode ? GRAY._500 : GRAY._200 },
}
export type TStatusColors = keyof typeof status

export const gtColor = {
    primary: PURPLE._1,
    secondary: PURPLE._2,
}
