import React from 'react'
import * as ReactDOMServer from 'react-dom/server'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string | JSX.Element
    tooltipId: string
    inline?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline }: TooltipWrapperProps) => {
    const tooltip = typeof dataTip === 'string' ? dataTip : ReactDOMServer.renderToString(dataTip)

    if (inline)
        return (
            <span data-tip={tooltip} data-for={tooltipId} data-html={true}>
                {children}
            </span>
        )
    return (
        <div data-tip={tooltip} data-for={tooltipId} data-html={true}>
            {children}
        </div>
    )
}

export default TooltipWrapper
