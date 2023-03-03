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
export const Truncated = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`
export const DeprecatedBold = styled.span`
    ${Typography.deprecated_bold};
`
