// old
export const border = {
    extra_light: '#F0F3F7',
    light: '#DADADA',
    gray: '#717179',
    purple: '#5634CF',
}

// old but sorta new?
export const icon = {
    white: '#FFFFFF',
    gray: '#717179',
    red: '#E24858',
    yellow: '#FFBA0D',
    blue: '#25BEFF',
    green: '#41802E',
    orange: '#FF8200',
    purple: '#5634CF',
    black: '#000000',
}
export type TIconColor = keyof typeof icon

// old button colors
export const button = {
    primary: {
        default: '#5634CF',
        hover: `linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), ${'#5634CF'}`,
        active_text: '#DADADA',
    },
    secondary: {
        default: '#FFFFFF',
        hover: '#DADADA',
        active_text: '#000000',
    },
}

// old status colors
export const status = {
    red: { default: '#E24858', light: '#F6C8CD' },
    yellow: { default: '#FFBA0D', light: '#FFEAB6' },
    green: { default: '#41802E', light: '#CFDFCB' },
    gray: { default: '#717179', light: '#DADADA' },
}
export type TStatusColors = keyof typeof status

// old gtColors
export const gtColor = {
    primary: '#5634CF',
    secondary: '#EEEBFA',
    orange: '#FF8200',
    blue: '#405EFB',
}

export const accent = {
    pink: '#DB2979',
    yellow: '#FBDD40',
}

export const background = {
    white: '#FFFFFF',
    base: '#FDFDFD',
    sub: '#F4F4F5',
    border: '#E4E4E7',
    hover: '#D4D4D8',

    // old
    light: '#FBFBFB',
    medium: '#F0F3F7',
    dark: '#DADADA',
    black: '#000000',
    dropIndicator: '#E1D7FD33',
}

export const text = {
    title: '#18181B',
    base: '#3F3F46',
    muted: '#71717A',

    // old
    black: '#000000',
    light: '#717179',
    white: '#FFFFFF',
    orange: '#FF8200',
    green: '#41802E',
    red: '#E24858',
    purple: '#5634CF',
}
export type TTextColor = keyof typeof text

export const control = {
    primary: {
        label: '#FDFDFD',
        bg: '#DB2979',
        hover: '#7E1645',
        highlight: '#F54C98',
    },
    secondary: {
        label: '#3F3F46',
        bg: '#FDFDFD',
        stroke: '#E4E4E7',
        hover: '#E4E4E7',
        highlight: '#DB2979',
    },
    destructive: {
        label: '#FFFFFF',
        bg: '#BE0A16',
        hover: '#701513',
        highlight: '#E53742',
    },
}

export const semantic = {
    success: {
        base: '#16A249',
        hover: '#10652F',
        faint: '#16A249',
    },
    warning: {
        base: '#BE0A16',
        hover: '#701513',
        faint: '#FCEEEA',
    },
    highlight: {
        base: '#FBDD40',
        hover: '#C39A2B',
        faint: '#16A249',
    },
}
