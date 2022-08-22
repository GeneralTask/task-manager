import React from 'react'

interface FadeOutContainerProps {
    children: React.ReactNode
}
const FadeOutContainer = ({ children, ...attr }: FadeOutContainerProps) => {
    return <div {...attr}>{children}</div>
}

export default FadeOutContainer
