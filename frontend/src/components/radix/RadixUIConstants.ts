import styled, { css } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TIconColor, TTextColor } from '../../styles/colors'
import { TIconType } from '../atoms/Icon'

export const MENU_WIDTH = '192px'
const MENU_LABEL_WIDTH = '100px'

export const MenuTriggerShared = css<{ $unstyled?: boolean }>`
    all: unset;
    width: 100%;
    height: 100%;
    ${({ $unstyled }) =>
        !$unstyled &&
        `
        border-radius: ${Border.radius.medium};
        &:focus {
            outline: ${Border.stroke.small} solid ${Colors.background.border};
        }
    `}
`
export const MenuItemShared = css<{ $textColor?: TTextColor; $disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    width: ${MENU_WIDTH};
    flex: 1;
    margin: ${Spacing._4} 0;
    padding: ${Spacing._4} ${Spacing._12};
    outline: none;
    border-radius: ${Border.radius.small};
    ${({ $textColor }) => $textColor && `color: ${Colors.text[$textColor]};`}
    ${({ $disabled }) => !$disabled && `cursor: pointer;`}
    &[data-highlighted] {
        ${({ $disabled }) =>
            !$disabled &&
            `
        outline: ${Border.stroke.small} solid ${Colors.background.border};
        background-color: ${Colors.background.sub};
        `}
    }
    &[data-state='open'] {
        outline: ${Border.stroke.small} solid ${Colors.background.border};
        background-color: ${Colors.background.sub};
    }
`
export const MenuContentShared = css`
    z-index: 300;
    ${Typography.body};
    padding: ${Spacing._4};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    box-shadow: ${Shadows.deprecated_light};
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
    min-width: ${MENU_LABEL_WIDTH};
`

export interface GTMenuItem {
    label: string
    onClick?: () => void
    icon?: TIconType
    iconColor?: TIconColor // should take priority over iconColorHex
    iconColorHex?: string
    textColor?: TTextColor
    selected?: boolean
    hideCheckmark?: boolean
    disabled?: boolean
    subItems?: GTMenuItem[]
    renderer?: () => JSX.Element // override how the option is rendered
    count?: number
    keepOpenOnSelect?: boolean
    tip?: string
}
