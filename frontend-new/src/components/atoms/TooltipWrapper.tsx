import React from 'react'
import { Platform } from 'react-native'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string
    tooltipId: string
    inline?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline }: TooltipWrapperProps) => {
    if (Platform.OS !== 'web') return children

    if (inline)
        return (
            <span data-tip={dataTip} data-for={tooltipId}>
                {children}
            </span>
        )
    return (
        <div data-tip={dataTip} data-for={tooltipId}>
            {children}
        </div>
    )
}

export default TooltipWrapper
