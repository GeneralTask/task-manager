import { Dimensions } from '../../styles'
import { TIconSize } from '../../styles/dimensions'
import React from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

const IconContainer = styled.div<{ width: string; height: string }>`
    width: ${(props) => props.width};
    height: ${(props) => props.height};
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
`
interface IconProps {
    icon: IconProp | string
    size: TIconSize
    color?: string
}
export const Icon = (props: IconProps) => {
    const dimension = Dimensions.iconSize[props.size]
    const fontSize = dimension / 1.5
    const iconColor = props.color ? props.color : 'gray'

    return (
        <IconContainer width={`${dimension}px`} height={`${dimension}px`}>
            {typeof props.icon === 'string' ? (
                <span style={{ fontSize: `${fontSize}px`, color: iconColor }}>
                    <i className={props.icon}></i>
                </span>
            ) : (
                <FontAwesomeIcon icon={props.icon} color={iconColor} />
            )}
        </IconContainer>
    )
}
