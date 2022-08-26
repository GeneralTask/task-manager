import React from 'react'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string
    tooltipId: string
    inline?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline, ...props }: TooltipWrapperProps) => {
    if (inline)
        return (
            <span data-tip={dataTip} data-for={tooltipId} data-html={true} {...props}>
                {children}
            </span>
        )
    return (
        <div data-tip={dataTip} data-for={tooltipId} data-html={true} {...props}>
            {children}
        </div>
    )
}

export default TooltipWrapper
