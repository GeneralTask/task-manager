import { css } from 'styled-components'

export const landingScreen = {
    header: '58px',
    subheader: '27px',
    faqHeader: '36px',
    faqItem: '18px',
}

const fontSize = {
    xxSmall: '10px',
    xSmall: '12px',
    small: '14px',
    medium: '16px',
    large: '20px',
    xLarge: '32px',
    xxLarge: '48px',
}
const lineHeight = {
    xSmall: '14px',
    small: '16px',
    medium: '24px',
    large: '40px',
    xLarge: '56px',
}
const weight2 = {
    regular: '400',
    medium: '510',
    semibold: '590',
    bold: '700',
}

export const header = css`
    font-size: ${fontSize.xxLarge};
    line-height: ${lineHeight.xLarge};
    font-weight: ${weight2.bold};
    letter-spacing: -.02em; // -2%
`
export const title = css`
    font-size: ${fontSize.xLarge};
    line-height: ${lineHeight.large};
    font-weight: ${weight2.semibold};
    letter-spacing: -.01em; // -1%
`
export const subtitle = css`
    font-size: ${fontSize.large};
    line-height: ${lineHeight.medium};
    font-weight: ${weight2.medium};
    letter-spacing: -.01em; // -1%
`
export const body = css`
    font-size: ${fontSize.medium};
    line-height: ${lineHeight.medium};
    font-weight: ${weight2.regular};
    letter-spacing: -.01em; // -1%
`
export const bodySmall = css`
    font-size: ${fontSize.small};
    line-height: ${lineHeight.medium};
    font-weight: ${weight2.regular};
    letter-spacing: -.01em; // -1%
`
export const label = css`
    font-size: ${fontSize.xSmall};
    line-height: ${lineHeight.small};
    font-weight: ${weight2.regular};
    letter-spacing: -.01em; // -1%
`
export const eyebrow = css`
    font-size: ${fontSize.xSmall};
    line-height: ${lineHeight.small};
    font-weight: ${weight2.regular};
    letter-spacing: .12em; // 12%
    text-transform: uppercase;
`
export const mini = css`
    font-size: ${fontSize.xxSmall};
    line-height: ${lineHeight.xSmall};
    font-weight: ${weight2.regular};
`
