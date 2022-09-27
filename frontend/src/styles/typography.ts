import { css } from 'styled-components'

export const landingScreen = {
    header: '58px',
    subheader: '27px',
    faqHeader: '36px',
    faqItem: '18px',
}

const fontSize = {
    xxs: '10px',
    xs: '12px',
    s: '14px',
    m: '16px',
    l: '20px',
    xl: '32px',
    xxl: '48px',
}
const lineHeight = {
    xs: '14px',
    s: '16px',
    m: '24px',
    l: '40px',
    xl: '56px',
}
const weight = {
    regular: '400',
    medium: '510',
    semibold: '590',
    bold: '700',
}
const GTFontFamily = css`
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol' !important;
`

export const header = css`
    ${GTFontFamily};
    font-size: ${fontSize.xxl}; // 48px
    line-height: ${lineHeight.xl}; // 56px
    font-weight: ${weight.bold}; // 700
    letter-spacing: -0.02em; // -2%
`
export const title = css`
    ${GTFontFamily};
    font-size: ${fontSize.xl}; // 32px
    line-height: ${lineHeight.l}; // 40px
    font-weight: ${weight.semibold}; // 590
    letter-spacing: -0.01em; // -1%
`
export const subtitle = css`
    ${GTFontFamily};
    font-size: ${fontSize.l}; // 20px
    line-height: ${lineHeight.m}; // 24px
    font-weight: ${weight.medium}; // 510
    letter-spacing: -0.01em; // -1%
`
export const body = css`
    ${GTFontFamily};
    font-size: ${fontSize.m}; // 16px
    line-height: ${lineHeight.m}; // 24px
    font-weight: ${weight.regular}; // 400
    letter-spacing: -0.01em; // -1%
`
export const bodySmall = css`
    ${GTFontFamily};
    font-size: ${fontSize.s}; // 14px
    line-height: ${lineHeight.m}; // 24px
    font-weight: ${weight.regular}; // 400
    letter-spacing: -0.01em; // -1%
`
export const label = css`
    ${GTFontFamily};
    font-size: ${fontSize.xs}; // 12px
    line-height: ${lineHeight.s}; // 16px
    font-weight: ${weight.regular}; // 400
    letter-spacing: -0.01em; // -1%
`
export const eyebrow = css`
    ${GTFontFamily};
    font-size: ${fontSize.xs}; // 12px
    line-height: ${lineHeight.s}; // 16px
    font-weight: ${weight.regular}; // 400
    letter-spacing: 0.12em; // 12%
    text-transform: uppercase; // UPPERCASE
`
export const mini = css`
    ${GTFontFamily};
    font-size: ${fontSize.xxs}; // 10px
    line-height: ${lineHeight.xs}; // 14px
    font-weight: ${weight.regular}; // 400
`
export const bold = css`
    font-weight: ${weight.bold};
`
