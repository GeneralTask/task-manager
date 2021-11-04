import styled from 'styled-components'

export const device = {
  mobile: '(max-width: 768px)',
  tablet: '(max-width: 1280px)',
  laptop: '(max-width: 1324px)',
  desktop: '(max-width: 2560px)',
}

export const flex = {
  flex: styled.div`display: flex;`,
  alignItemsCenter: styled.div`display: flex; align-items: center`,
  justifyContentSpaceBetween: styled.div`display: flex; justify-content: space-between`,
  centerXY: styled.div`display: flex; justify-content: space-between; align-items: center`,
}

export const TEXT_GRAY = '#969696'
export const TEXT_BLACK = '#000000'
export const TEXT_WHITE = '#ffffff'
export const TEXT_BLACK_HOVER = '#464646'
export const TEXT_LIGHTGRAY = '#CCCCCC'

export const BACKGROUND_PRIMARY = '#007bff'
export const BACKGROUND_PRIMARY_HOVER = '#0069d9'
export const BORDER_PRIMARY_HOVER = '#0062cc'

export const DIVIDER_LIGHTGRAY = '#DDDDDD'

export const BORDER_PRIMARY = '#cccccc'
export const BACKGROUND_WHITE = '#ffffff'

export const BACKGROUND_HOVER = '#e3e3e3'

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
