import React from 'react'
import styled from 'styled-components'
import { TOOLTIPS_BACKGROUND, TOOLTIPS_OPACITY, TOOLTIPS_SHADOW, TOOLTIPS_HEIGHT } from '../../helpers/styles'

const RelativeDiv = styled.div`
    position: relative;
    height: fit-content;
    width: 100%;
`
const TooltipContainer = styled.div<{ show: boolean, direction: string }>`
    --tooltip-spacing: 25px;
    visibility: ${props => props.show ? 'visible' : 'hidden'};
    height: ${TOOLTIPS_HEIGHT};
    width: max-content;
    line-height: ${TOOLTIPS_HEIGHT};
    padding: 6px 6px 6px 8px;
    position: absolute;
    pointer-events: none;
    box-shadow: ${TOOLTIPS_SHADOW};
    opacity: ${TOOLTIPS_OPACITY};
    background-color: ${TOOLTIPS_BACKGROUND};
    text-align: center;
    border-radius: 6px;
    z-index: 1;
    left: 50%;
    transform: translate(-50%, -50%);
    &::after {
        content: "";
        position: absolute;
        ${props => props.direction === 'above' ? 'top: 100%' : 'bottom: 100%'};
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: ${props => props.direction === 'above' ?
        `${TOOLTIPS_BACKGROUND} transparent transparent transparent ` :
        `transparent transparent ${TOOLTIPS_BACKGROUND} transparent `};
        opacity: ${TOOLTIPS_OPACITY};
    }
    ${props => props.direction === 'above' ?
        'top: calc(var(--tooltip-spacing) * -1)' :
        'top: calc(100% + var(--tooltip-spacing))'
    };
`
interface TooltipProps {
    children: JSX.Element | JSX.Element[],
    text: string,
    placement?: 'above' | 'below',
}
function Tooltip(props: TooltipProps): JSX.Element {
    let timeout: NodeJS.Timeout | undefined
    const [show, setShow] = React.useState(false)

    const showToolTip = () => {
        timeout = setTimeout(() => {
            setShow(true)
        }, 1000)
    }
    const hideToolTip = () => {
        if (timeout) { clearTimeout(timeout) }
        setShow(false)
    }
    return <RelativeDiv onMouseOver={showToolTip} onMouseOut={hideToolTip}>
        {props.children}
        <TooltipContainer show={show} direction={props.placement || 'above'} >{props.text}</TooltipContainer>
    </RelativeDiv>
}

export default Tooltip
