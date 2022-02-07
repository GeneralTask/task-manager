import styled from 'styled-components'

export const device = {
    mobile: '(min-width: 768px)',
    tablet: '(min-width: 1280px)',
    laptop: '(min-width: 1324px)',
    desktop: '(min-width: 2560px)',
}

export const flex = {
    flex: styled.div`
        display: flex;
    `,
    alignItemsCenter: styled.div`
        display: flex;
        align-items: center;
    `,
    justifyContentSpaceBetween: styled.div`
        display: flex;
        justify-content: space-between;
    `,
    centerXY: styled.div`
        display: flex;
        justify-content: space-between;
        align-items: center;
    `,
}

export const BLACK = '#000000'
export const GRAY_900 = '#18181B'
export const GRAY_800 = '#27272A'
export const GRAY_700 = '#3F3F46'
export const GRAY_600 = '#52525B'
export const GRAY_500 = '#71717A'
export const GRAY_400 = '#A1A1AA'
export const GRAY_300 = '#D4D3D8'
export const GRAY_200 = '#E4E3E7'
export const GRAY_100 = '#F4F4F5'
export const GRAY_50 = '#FAFAFA'
export const WHITE = '#FFFFFF'
export const ACCENT_MAIN = '#5C31D7'
export const ACCENT_ACTIVE = '#3A15A0'
export const ACCENT_GLOW = '#E1D7FD'
export const RED_1 = '#FF135A'
export const RED_2 = '#FFEFF2'
export const ORANGE_1 = '#FFBA0D'
export const ORANGE_2 = '#FFF8E7'
export const GREEN_1 = '#00A538'
export const GREEN_2 = '#E6FFE9'
export const GRADIENT_BACKGROUND = 'linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), linear-gradient(98.72deg, #D1E4FF 8.86%, rgba(255, 255, 255, 0) 63.16%), linear-gradient(188.47deg, rgba(213, 193, 255, 0.5) 33.75%, rgba(255, 211, 124, 0.15) 93.52%), #FFFFFF'


export const TEXT_GRAY = GRAY_500
export const TEXT_BLACK = BLACK
export const TEXT_WHITE = WHITE
export const TEXT_BLACK_HOVER = GRAY_700
export const TEXT_LIGHTGRAY = GRAY_300
export const TEXT_DARKGRAY = GRAY_700
export const TEXT_KEYBOARD_SHORTCUT = GRAY_400


export const BACKGROUND_PRIMARY = '#007bff'
export const BACKGROUND_PRIMARY_HOVER = '#0069d9'
export const BORDER_PRIMARY_HOVER = '#0062cc'
export const TASKS_BACKROUND = '#F8F8F8'
export const TASKS_BACKGROUND_GRADIENT = '#F6F4FE'
export const ICON_HOVER = GRAY_100

export const TOOLTIPS_HEIGHT = '25px'
export const TOOLTIPS_BACKGROUND = WHITE
export const TOOLTIPS_OPACITY = '.95'
export const TOOLTIPS_SHADOW = '0px 4px 20px rgba(43, 43, 43, 0.08)'

export const EVENT_SHADOW = '0px 1px 2px rgba(0, 0, 0, 0.07)'

export const DIVIDER_LIGHTGRAY = GRAY_300

export const BORDER_PRIMARY = GRAY_300
export const BORDER_ERROR = RED_1
export const BACKGROUND_WHITE = WHITE
export const BACKGROUND_KEYBOARD_SHORTCUT = '#F6F5F6'

export const BACKGROUND_HOVER = '#e3e3e3'

export const SHADOW_PRIMARY = '0px 0px 10px rgba(0, 0, 0, 0.06)'
export const SHADOW_EXPANDED = '0px 0px 10px rgba(0, 0, 0, 0.12)'
export const SHADOW_EVENT_ALERT = '0px 4px 20px rgba(43, 43, 43, 0.08)'
export const SHADOW_KEYBOARD_SHORTCUT = '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)'

export const NoSelect = styled.div`
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
`

export const Margin = {
    ml10: '0 0 0 10px', // margin-left: 10px
}

export const UNSELECTED_NAVBAR_COLOR = GRAY_400
export const DOMINO_COLOR = GRAY_400

export const CELL_HEIGHT = 64
export const TABLE_WIDTH_PERCENTAGE = 95
export const CELL_TIME_WIDTH = 43
export const CELL_BORDER_WIDTH = 3
export const CELL_LEFT_MARGIN = 10
export const EVENT_CONTAINER_COLOR = GRAY_50
export const EVENT_TITLE_TEXT_COLOR = GRAY_700
export const EVENT_TIME_TEXT_COLOR = GRAY_500
export const CALENDAR_TD_COLOR = GRAY_200
export const CALENDAR_TIME_COLOR = GRAY_400
export const CALENDAR_INDICATOR_COLOR = '#D7470A'
export const CALENDAR_DEFAULT_SCROLL_HOUR = 8
export const EVENT_BOTTOM_PADDING = 2.5
