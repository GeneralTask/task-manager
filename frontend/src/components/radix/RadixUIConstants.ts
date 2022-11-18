import styled, { css } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TIconColor, TTextColor } from '../../styles/colors'
import { TIconType } from '../atoms/Icon'

const MENU_WIDTH = '192px'

export const MenuTriggerShared = css`
    all: unset;
    border-radius: ${Border.radius.small};
    width: 100%;
    &:focus {
        outline: ${Border.stroke.small} solid ${Colors.border.light};
    }
`
export const MenuItemShared = css<{ textcolor?: TTextColor; disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    width: ${MENU_WIDTH};
    flex: 1;
    margin: ${Spacing._4} 0;
    padding: ${Spacing._4} ${Spacing._12};
    outline: none;
    border-radius: ${Border.radius.mini};
    ${({ textcolor }) => textcolor && `color: ${Colors.text[textcolor]};`}
    ${({ disabled }) =>
        !disabled &&
        `:hover, :focus {
        outline: ${Border.stroke.small} solid ${Colors.border.light};
        background-color: ${Colors.background.medium};
    }
    cursor: pointer;
    `}
    &[data-state='open'] {
        outline: ${Border.stroke.small} solid ${Colors.border.light};
        background-color: ${Colors.background.medium};
    }
`
export const MenuContentShared = css`
    z-index: 5;
    ${Typography.body};
    padding: ${Spacing._4};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    box-shadow: ${Shadows.light};
`
export const MarginLeftIcon = styled.div`
    margin-left: auto;
`
export const FixedSizeIcon = styled.div<{ visible?: boolean }>`
    opacity: ${({ visible }) => (visible ? 1 : 0)};
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
    disabled?: boolean
    subItems?: GTMenuItem[]
    renderer?: () => JSX.Element // override how the option is rendered
}
