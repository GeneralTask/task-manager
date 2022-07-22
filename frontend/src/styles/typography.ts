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
const weight2 = {
    regular: '400',
    medium: '510',
    semibold: '590',
    bold: '700',
}

export const header = css`
    font-size: ${fontSize.xxl};
    line-height: ${lineHeight.xl};
    font-weight: ${weight2.bold};
    letter-spacing: -.02em; // -2%
`
export const title = css`
    font-size: ${fontSize.xl};
    line-height: ${lineHeight.l};
    font-weight: ${weight2.semibold};
    letter-spacing: -.01em; // -1%
`
export const subtitle = css`
    font-size: ${fontSize.l};
    line-height: ${lineHeight.m};
    font-weight: ${weight2.medium};
    letter-spacing: -.01em; // -1%
`
export const body = css`
    font-size: ${fontSize.m};
    line-height: ${lineHeight.m};
    font-weight: ${weight2.regular};
    letter-spacing: -.01em; // -1%
`
export const bodySmall = css`
    font-size: ${fontSize.s};
    line-height: ${lineHeight.m};
    font-weight: ${weight2.regular};
    letter-spacing: -.01em; // -1%
`
export const label = css`
    font-size: ${fontSize.xs};
    line-height: ${lineHeight.s};
    font-weight: ${weight2.regular};
    letter-spacing: -.01em; // -1%
`
export const eyebrow = css`
    font-size: ${fontSize.xs};
    line-height: ${lineHeight.s};
    font-weight: ${weight2.regular};
    letter-spacing: .12em; // 12%
    text-transform: uppercase;
`
export const mini = css`
    font-size: ${fontSize.xxs};
    line-height: ${lineHeight.xs};
    font-weight: ${weight2.regular};
`
