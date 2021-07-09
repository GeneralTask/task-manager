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

export const darkGray = '#969696'
export const lightGray = '#cccccc'
export const hoverGray = '#e3e3e3'