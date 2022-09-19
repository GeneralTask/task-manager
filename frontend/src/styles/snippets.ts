import { css } from 'styled-components'

export const hideScrollbars = css`
    scrollbar-width: none;      // Firefox
    -ms-overflow-style: none;   // IE and Edge
    ::-webkit-scrollbar {       // Chrome, Safari, and Opera
        display: none;
    }
`
