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

export const TEXT_GRAY = '#969696'
export const TEXT_BLACK = '#000000'
export const TEXT_WHITE = '#ffffff'
export const TEXT_BLACK_HOVER = '#464646'
export const TEXT_LIGHTGRAY = '#CCCCCC'
export const TEXT_DARKGRAY = '#333333'

export const BACKGROUND_PRIMARY = '#007bff'
export const BACKGROUND_PRIMARY_HOVER = '#0069d9'
export const BORDER_PRIMARY_HOVER = '#0062cc'
export const TASKS_BACKROUND = '#F8F8F8'
export const TASKS_BACKGROUND_GRADIENT = '#F6F4FE'
export const ICON_HOVER = '#F4F4F5'

export const TOOLTIPS_HEIGHT = '25px'
export const TOOLTIPS_BACKGROUND = '#FFFFFF'
export const TOOLTIPS_OPACITY = '.95'
export const TOOLTIPS_SHADOW = '0px 4px 20px rgba(43, 43, 43, 0.08)'

export const EVENT_SHADOW = '0px 1px 2px rgba(0, 0, 0, 0.07)'

export const DIVIDER_LIGHTGRAY = '#DDDDDD'

export const BORDER_PRIMARY = '#cccccc'
export const BORDER_ERROR = '#FF0000'
export const BACKGROUND_WHITE = '#ffffff'

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

export const UNSELECTED_NAVBAR_COLOR = '#A1A1AA'
export const DOMINO_COLOR = '#A1A1AA'

export const CELL_HEIGHT = 64
export const TABLE_WIDTH_PERCENTAGE = 95
export const CELL_TIME_WIDTH = 43
export const CELL_BORDER_WIDTH = 3
export const CELL_LEFT_MARGIN = 10
export const EVENT_CONTAINER_COLOR = '#FAFAFA'
export const EVENT_TITLE_TEXT_COLOR = '#3F3F46'
export const EVENT_TIME_TEXT_COLOR = '#71717A'
export const CALENDAR_TD_COLOR = '#E4E3E7'
export const CALENDAR_TIME_COLOR = '#A1A1AA'
export const CALENDAR_INDICATOR_COLOR = '#D7470A'
export const CALENDAR_DEFAULT_SCROLL_HOUR = 8
export const EVENT_BOTTOM_PADDING = 2.5
