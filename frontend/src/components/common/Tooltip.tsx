import React from 'react'
import styled from 'styled-components'
import { TOOLSTIP_BACKGROUND, TOOLSTIP_OPACITY, TOOLSTIP_SHADOW, TOOLSTIP_HEIGHT } from '../../helpers/styles'

const RelativeDiv = styled.div`
    position: relative;
    height: fit-content;
`
const TooltipContainer = styled.div<{ show: boolean, direction: string }>`
    --tooltip-spacing: 25px;
    visibility: ${props => props.show ? 'visible' : 'hidden'};
    height: ${TOOLSTIP_HEIGHT};
    width: max-content;
    line-height: ${TOOLSTIP_HEIGHT};
    padding: 6px 6px 6px 8px;
    position: absolute;
    pointer-events: none;
    box-shadow: ${TOOLSTIP_SHADOW};
    opacity: ${TOOLSTIP_OPACITY};
    background-color: ${TOOLSTIP_BACKGROUND};
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
        `${TOOLSTIP_BACKGROUND} transparent transparent transparent ` :
        `transparent transparent ${TOOLSTIP_BACKGROUND} transparent `};
        opacity: ${TOOLSTIP_OPACITY};
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
    return <RelativeDiv onMouseEnter={showToolTip} onMouseLeave={hideToolTip}>
        {props.children}
        <TooltipContainer show={show} direction={props.placement || 'above'} >{props.text}</TooltipContainer>
    </RelativeDiv>
}

export default Tooltip
