import { css } from 'styled-components'

const deprecated_fontSize = {
    xxs: '10px',
    xs: '12px',
    s: '14px',
    m: '16px',
    l: '20px',
    xl: '32px',
    xxl: '48px',
}
const deprecated_lineHeight = {
    xs: '14px',
    s: '16px',
    m: '24px',
    l: '40px',
    xl: '56px',
}
const deprecated_weight = {
    regular: '400',
    medium: '510',
    semibold: '590',
    bold: '700',
}

export const deprecated_header = css`
    font-size: ${deprecated_fontSize.xxl}; // 48px
    line-height: ${deprecated_lineHeight.xl}; // 56px
    font-weight: ${deprecated_weight.bold}; // 700
    letter-spacing: -0.02em; // -2%
`
export const deprecated_title = css`
    font-size: ${deprecated_fontSize.xl}; // 32px
    line-height: ${deprecated_lineHeight.l}; // 40px
    font-weight: ${deprecated_weight.semibold}; // 590
    letter-spacing: -0.01em; // -1%
`
export const deprecated_subtitle = css`
    font-size: ${deprecated_fontSize.l}; // 20px
    line-height: ${deprecated_lineHeight.m}; // 24px
    font-weight: ${deprecated_weight.medium}; // 510
    letter-spacing: -0.01em; // -1%
`
export const deprecated_body = css`
    font-size: ${deprecated_fontSize.m}; // 16px
    line-height: ${deprecated_lineHeight.m}; // 24px
    font-weight: ${deprecated_weight.regular}; // 400
    letter-spacing: -0.01em; // -1%
`
export const deprecated_bodySmall = css`
    font-size: ${deprecated_fontSize.s}; // 14px
    line-height: ${deprecated_lineHeight.m}; // 24px
    font-weight: ${deprecated_weight.regular}; // 400
    letter-spacing: -0.01em; // -1%
`
export const deprecated_labelHeavy = css`
    font-size: ${deprecated_fontSize.xs}; // 12px
    line-height: ${deprecated_lineHeight.s}; // 16px
    font-weight: ${deprecated_weight.medium}; // 510
`
export const deprecated_label = css`
    font-size: ${deprecated_fontSize.xs}; // 12px
    line-height: ${deprecated_lineHeight.s}; // 16px
    font-weight: ${deprecated_weight.regular}; // 400
    letter-spacing: -0.01em; // -1%
`
export const deprecated_eyebrow = css`
    font-size: ${deprecated_fontSize.xs}; // 12px
    line-height: ${deprecated_lineHeight.s}; // 16px
    font-weight: ${deprecated_weight.regular}; // 400
    letter-spacing: 0.12em; // 12%
    text-transform: uppercase; // UPPERCASE
`
export const deprecated_mini = css`
    font-size: ${deprecated_fontSize.xxs}; // 10px
    line-height: ${deprecated_lineHeight.xs}; // 14px
    font-weight: ${deprecated_weight.regular}; // 400
`
export const deprecated_bold = css`
    font-weight: ${deprecated_weight.medium}; // 510
`

export const display = {
    large: css`
        font-size: 57px;
        line-height: 64px;
        font-weight: 400;
        letter-spacing: 0px;
    `,
    medium: css`
        font-size: 45px;
        line-height: 52px;
        font-weight: 400;
        letter-spacing: 0px;
    `,
    small: css`
        font-size: 36px;
        line-height: 44px;
        font-weight: 400;
        letter-spacing: 0px;
    `,
}

export const headline = {
    large: css`
        font-size: 32px;
        line-height: 40px;
        font-weight: 400;
        letter-spacing: 0px;
    `,
    medium: css`
        font-size: 28px;
        line-height: 36px;
        font-weight: 400;
        letter-spacing: 0px;
    `,
    small: css`
        font-size: 24px;
        line-height: 32px;
        font-weight: 400;
        letter-spacing: 0px;
    `,
}

export const title = {
    large: css`
        font-size: 22px;
        line-height: 28px;
        font-weight: 510;
        letter-spacing: 0px;
    `,
    medium: css`
        font-size: 16px;
        line-height: 24px;
        font-weight: 510;
        letter-spacing: 0.15px;
    `,
    small: css`
        font-size: 14px;
        line-height: 20px;
        font-weight: 510;
        letter-spacing: 0.1px;
    `,
}

export const body = {
    large: css`
        font-size: 16px;
        line-height: 24px;
        font-weight: 400;
        letter-spacing: 0.5px;
    `,
    medium: css`
        font-size: 14px;
        line-height: 20px;
        font-weight: 400;
        letter-spacing: 0.25px;
    `,
    small: css`
        font-size: 12px;
        line-height: 16px;
        font-weight: 400;
        letter-spacing: 0.4px;
    `,
}

export const label = {
    large: css`
        font-size: 14px;
        line-height: 20px;
        font-weight: 510;
        letter-spacing: 0.1px;
    `,
    medium: css`
        font-size: 12px;
        line-height: 16px;
        font-weight: 510;
        letter-spacing: 0.5px;
    `,
    small: css`
        font-size: 11px;
        line-height: 16px;
        font-weight: 510;
        letter-spacing: 0.5px;
    `,
}
