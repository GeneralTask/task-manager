import styled, { css } from 'styled-components'
import { Colors, Typography } from '../../../styles'
import { TTextColor } from '../../../styles/colors'

const SharedStyles = css<{ color: TTextColor }>`
    color: ${(props) => Colors.text[props.color]};
    font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
        Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
`

const HeaderStyle = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.header};
`
const TitleStyle = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.title};
`
const SubtitleStyle = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.subtitle};
`
const BodyStyle = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.body};
`
const BodySmallStyles = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.bodySmall};
`
const LabelStyles = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.label};
`
const EyebrowStyles = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.eyebrow};
`
const MiniStyles = styled.span<{ color: TTextColor }>`
    ${SharedStyles};
    ${Typography.mini};
`
interface TypographyProps {
    children: string | undefined
    color?: TTextColor
}
export const Header = ({ children, color = 'black' }: TypographyProps) => {
    return <HeaderStyle color={color}>{children}</HeaderStyle>
}
export const Title = ({ children, color = 'black' }: TypographyProps) => {
    return <TitleStyle color={color}>{children}</TitleStyle>
}
export const Subtitle = ({ children, color = 'black' }: TypographyProps) => {
    return <SubtitleStyle color={color}>{children}</SubtitleStyle>
}
export const Body = ({ children, color = 'black' }: TypographyProps) => {
    return <BodyStyle color={color}>{children}</BodyStyle>
}
export const BodySmall = ({ children, color = 'black' }: TypographyProps) => {
    return <BodySmallStyles color={color}>{children}</BodySmallStyles>
}
export const Label = ({ children, color = 'black' }: TypographyProps) => {
    return <LabelStyles color={color}>{children}</LabelStyles>
}
export const Eyebrow = ({ children, color = 'black' }: TypographyProps) => {
    return <EyebrowStyles color={color}>{children}</EyebrowStyles>
}
export const Mini = ({ children, color = 'black' }: TypographyProps) => {
    return <MiniStyles color={color}>{children}</MiniStyles>
}
