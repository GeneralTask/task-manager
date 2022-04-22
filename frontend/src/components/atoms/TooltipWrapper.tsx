import React from 'react'
import * as ReactDOMServer from 'react-dom/server'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string | JSX.Element
    tooltipId: string
    inline?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline }: TooltipWrapperProps) => {
    const tooltip = typeof dataTip !== 'string' ? ReactDOMServer.renderToString(dataTip) : dataTip

    if (inline)
        return (
            <span data-tip={tooltip} data-for={tooltipId} data-html={typeof dataTip !== 'string'}>
                {children}
            </span>
        )
    return (
        <div data-tip={tooltip} data-for={tooltipId} data-html={typeof dataTip !== 'string'}>
            {children}
        </div>
    )
}

export default TooltipWrapper
