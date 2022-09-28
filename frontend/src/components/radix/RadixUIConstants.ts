import styled, { css } from 'styled-components'
import { Spacing, Border, Colors, Shadows, Typography } from '../../styles'
import { TIconColor, TTextColor } from '../../styles/colors'
import { TIconType } from '../atoms/Icon'

const MENU_WIDTH = '172px'

export const MenuItemShared = css<{ $isSelected?: boolean; $textColor?: TTextColor }>`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    flex: 1;
    margin: ${Spacing._4} 0;
    padding: ${Spacing._4} ${Spacing._12};
    cursor: pointer;
    outline: none;
    border-radius: ${Border.radius.mini};
    ${({ $textColor }) => $textColor && `color: ${Colors.text[$textColor]};`}
    ${({ $isSelected }) => $isSelected && `background-color: ${Colors.background.medium};`}
    :hover, :focus {
        background-color: ${Colors.background.dark};
    }
`
export const MenuContentShared = css`
    z-index: 5;
    width: ${MENU_WIDTH};
    ${Typography.body};
    padding: ${Spacing._4};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    box-shadow: ${Shadows.light};
`
export const MarginLeftIcon = styled.div`
    margin-left: auto;
`
export const MenuItemLabel = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export interface GTMenuItem {
    label: string
    onClick?: () => void
    icon?: TIconType
    iconColor?: TIconColor
    textColor?: TTextColor
    selected?: boolean
    subItems?: GTMenuItem[]
    renderer?: () => JSX.Element // override how the option is rendered
}
