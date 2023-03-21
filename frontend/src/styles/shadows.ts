import { css } from 'styled-components'
import { background } from './colors'

export const deprecated_light = '0px 4px 8px rgba(0, 0, 0, 0.08)'
export const deprecated_medium = '0px 8px 20px rgba(0, 0, 0, 0.16)'

export const deprecated_button = {
    default: '0px -1px 0px rgba(0, 0, 0, 0.04), 0px 1px 2px rgba(0, 0, 0, 0.15)',
    active: 'inset 0px 2px 4px rgba(0, 0, 0, 0.25)',
    hover: '0px 4px 8px rgba(0, 0, 0, 0.1)',
}

// currently not used
export const xs = '0px 1px 2px 0px rgba(0, 0, 0, 0.05)'
// text area hover + button default
export const sm = '0px 1px 3px 0px rgba(0, 0, 0, 0.08)'
// calendar sidebar + button hover
export const m = '0px 2.5px 4px -1px rgba(0, 0, 0, 0.15)'
// modal + toast
export const l = '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)'

export const scrollShadow = css`
    background:
    /* Shadow Cover TOP */ linear-gradient(${background.sub} 30%, rgba(255, 255, 255, 0)) center top,
        /* Shadow Cover BOTTOM */ linear-gradient(rgba(255, 255, 255, 0), ${background.sub} 70%) center bottom,
        /* Shadow TOP */ radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0)) center top,
        /* Shadow BOTTOM */ radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0)) center
            bottom;

    background-repeat: no-repeat;
    background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
    background-attachment: local, local, scroll, scroll;
`
