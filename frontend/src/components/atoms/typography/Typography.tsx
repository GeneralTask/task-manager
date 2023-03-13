import styled, { css } from 'styled-components'
import { Colors, Typography } from '../../../styles'
import { TTextColor } from '../../../styles/colors'

const SharedStyles = css<{ color?: TTextColor }>`
    color: ${(props) => (props.color ? Colors.text[props.color] : Colors.text.base)};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
`

export const DeprecatedHeader = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_header};
`
export const DeprecatedTitle = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_title};
`
export const DeprecatedSubtitle = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_subtitle};
`
export const DeprecatedBody = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_body};
`
export const DeprecatedBodySmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_bodySmall};
`
export const DeprecatedLabel = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_label};
`
export const DeprecatedEyebrow = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_eyebrow};
`
export const DeprecatedMini = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.deprecated_mini};
`
export const DeprecatedBold = styled.span`
    ${Typography.deprecated_bold};
`

export const DisplayLarge = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.display.large};
`
export const DisplayMedium = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.display.medium};
`
export const DisplaySmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.display.small};
`
export const HeadlineLarge = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.headline.large};
`
export const HeadlineMedium = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.headline.medium};
`
export const HeadlineSmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.headline.small};
`
export const TitleLarge = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.title.large};
`
export const TitleMedium = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.title.medium};
`
export const TitleSmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.title.small};
`
export const BodyLarge = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.body.large};
`
export const BodyMedium = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.body.medium};
`
export const BodySmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.body.small};
`
export const LabelLarge = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.label.large};
`
export const LabelMedium = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.label.medium};
`
export const LabelSmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.label.small};
`

export const Truncated = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`
