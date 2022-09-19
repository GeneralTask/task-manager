import { css } from "styled-components";
import { Spacing, Border, Colors, Shadows, Typography } from "../../styles";
import { TTextColor } from "../../styles/colors";


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
    white-space: nowrap;
    overflow: clip;
    text-overflow: ellipsis;
    ${({ $textColor }) => $textColor && `color: ${Colors.text[$textColor]};`}
    ${({ $isSelected }) => $isSelected && `background-color: ${Colors.background.medium};`}
    :hover, :focus {
        background-color: ${Colors.background.dark};
    }
`

export const MenuContentShared = css`
    z-index: 5;
    ${Typography.body};
    padding: ${Spacing._4};
    width: ${MENU_WIDTH};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    box-shadow: ${Shadows.light};
`
