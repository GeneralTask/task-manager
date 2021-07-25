import styled from 'styled-components'

export const device = {
    mobile: '(min-width: 320px)',
    tablet: '(min-width: 1280px)',
    laptop: '(min-width: 1324px)',
    desktop: '(min-width: 2560px)',
}

export const flex = {
    flex: styled.div`display: flex;`,
    alignItemsCenter: styled.div`display: flex; align-items: center`,
    justifyContentSpaceBetween: styled.div`display: flex; justify-content: space-between`,
}

export const TEXT_GRAY = '#969696'
export const TEXT_BLACK = '#000000'
export const TEXT_BLACK_HOVER = '#464646'
export const TEXT_LIGHTGRAY = '#CCCCCC'

export const BORDER_PRIMARY = '#cccccc'

export const BACKGROUND_HOVER = '#e3e3e3'