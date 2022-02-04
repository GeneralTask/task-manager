import React, { useRef } from 'react'
import { SHADOW_MISC_1, TOOLTIPS_BACKGROUND, TOOLTIPS_HEIGHT, TOOLTIPS_OPACITY } from '../../helpers/styles'

import { TOOLTIP_DELAY } from '../../constants'
import styled from 'styled-components'

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
    box-shadow: ${SHADOW_MISC_1};
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

type Children = JSX.Element | JSX.Element[] | boolean | null | undefined | Element | Element[] | string | number

interface TooltipProps {
    children: Children | Children[],
    text: string,
    placement?: 'above' | 'below',
}
function Tooltip(props: TooltipProps): JSX.Element {
    const timeout = useRef<NodeJS.Timeout>()
    const [show, setShow] = React.useState(false)

    const showToolTip = () => {
        timeout.current = setTimeout(() => {
            setShow(true)
        }, TOOLTIP_DELAY)
    }
    const hideToolTip = () => {
        if (timeout.current) { clearTimeout(timeout.current) }
        setShow(false)
    }
    return <RelativeDiv onMouseOver={showToolTip} onMouseOut={hideToolTip}>
        {props.children}
        <TooltipContainer show={show} direction={props.placement || 'above'} >{props.text}</TooltipContainer>
    </RelativeDiv>
}

export default Tooltip
