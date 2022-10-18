import styled, { css } from 'styled-components'
import { Colors, Typography } from '../../../styles'
import { TTextColor } from '../../../styles/colors'

const SharedStyles = css<{ color?: TTextColor }>`
    color: ${(props) => (props.color ? Colors.text[props.color] : Colors.text.black)};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
`

export const Header = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.header};
`
export const Title = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.title};
`
export const Subtitle = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.subtitle};
`
export const Body = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.body};
`
export const BodySmall = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.bodySmall};
`
export const Label = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.label};
`
export const Eyebrow = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.eyebrow};
`
export const Mini = styled.span<{ color?: TTextColor }>`
    ${SharedStyles};
    ${Typography.mini};
`
