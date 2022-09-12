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
export const weight = {
    regular: '400',
    medium: '510',
    semibold: '590',
    bold: '700',
}

export const header = css`
    font-size: ${fontSize.xxl};     // 48px
    line-height: ${lineHeight.xl};  // 56px
    font-weight: ${weight.bold};    // 700
    letter-spacing: -.02em;         // -2%
`
export const title = css`
    font-size: ${fontSize.xl};      // 32px
    line-height: ${lineHeight.l};   // 40px
    font-weight: ${weight.semibold};// 590
    letter-spacing: -.01em;         // -1%
`
export const subtitle = css`
    font-size: ${fontSize.l};       // 20px
    line-height: ${lineHeight.m};   // 24px
    font-weight: ${weight.medium};  // 510
    letter-spacing: -.01em;         // -1%
`
export const body = css`
    font-size: ${fontSize.m};       // 16px
    line-height: ${lineHeight.m};   // 24px
    font-weight: ${weight.regular}; // 400
    letter-spacing: -.01em;         // -1%
`
export const bodySmall = css`
    font-size: ${fontSize.s};       // 14px
    line-height: ${lineHeight.m};   // 24px
    font-weight: ${weight.regular}; // 400
    letter-spacing: -.01em;         // -1%
`
export const label = css`
    font-size: ${fontSize.xs};      // 12px
    line-height: ${lineHeight.s};   // 16px
    font-weight: ${weight.regular}; // 400
    letter-spacing: -.01em;         // -1%
`
export const eyebrow = css`
    font-size: ${fontSize.xs};      // 12px
    line-height: ${lineHeight.s};   // 16px
    font-weight: ${weight.regular}; // 400
    letter-spacing: .12em;          // 12%
    text-transform: uppercase;      // UPPERCASE
`
export const mini = css`
    font-size: ${fontSize.xxs};     // 10px
    line-height: ${lineHeight.xs};  // 14px
    font-weight: ${weight.regular}; // 400
`
export const bold = css`
    font-weight: ${weight.bold};
`

