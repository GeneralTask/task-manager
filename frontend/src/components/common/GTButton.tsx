import styled from 'styled-components'
import React, { MouseEvent } from 'react'
import { TEXT_BLACK, TEXT_BLACK_HOVER, TEXT_WHITE } from '../../helpers/styles'

const Button = styled.button<{
    theme: Theme,
    width?: string,
    height?: string,
    margin?: string,
}>`
  background-color: ${(props) => props.theme.backgroundColor};
  color: ${(props) => props.theme.color};
  border-radius: 2px;
  border: 2px solid ${(props) => props.theme.borderColor};
  /* margin: ${(props) => props.margin}; */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 6px 4px 6px;
  font-weight: 500;
  cursor: pointer;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  &:hover{
    background-color: ${(props) => props.theme.hoverBackgroundColor};
    border: 2px solid ${(props) => props.theme.hoverBorderColor};
    color: ${(props) => props.theme.hoverColor};
  }
`

type ThemeType = 'black' | 'primary'

interface Theme {
    backgroundColor: string,
    borderColor: string,
    color: string,
    hoverBackgroundColor: string,
    hoverBorderColor: string,
    hoverColor: string,
}

const themes = {
    black: {
        backgroundColor: TEXT_BLACK,
        borderColor: TEXT_BLACK,
        color: TEXT_WHITE,
        hoverBackgroundColor: TEXT_BLACK_HOVER,
        hoverBorderColor: TEXT_BLACK_HOVER,
        hoverColor: TEXT_WHITE,
    },
    // will update this to be a primary color
    primary: {
        backgroundColor: TEXT_BLACK,
        borderColor: TEXT_BLACK,
        color: TEXT_WHITE,
        hoverBackgroundColor: TEXT_BLACK_HOVER,
        hoverBorderColor: TEXT_BLACK_HOVER,
        hoverColor: TEXT_WHITE,
    },
}

interface Props {
    theme: ThemeType,
    onClick?: (e?: MouseEvent<HTMLButtonElement>) => void,
    children: JSX.Element | string,
    width?: string,
    height?: string,
    margin?: string,
}

function GTButton(props: Props): JSX.Element {
    return (
        <Button
            theme={themes[props.theme]}
            onClick={props.onClick}
            width={props.width}
            height={props.height}
            margin={props.margin}
        >
            {props.children}
        </Button>
    )
}

export default GTButton
