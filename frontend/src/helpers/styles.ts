import styled from 'styled-components'

export const device = {
    mobile: '(min-width: 320px)',
    tablet: '(min-width: 1280px)',
    laptop: '(min-width: 1324px)',
    desktop: '(min-width: 2560px)',
}

export const flex = {
    alignItemsCenter: styled.div`display: flex; align-items: center`,
    justifyContentSpaceBetween: styled.div`display: flex; justify-content: space-between`,
}
