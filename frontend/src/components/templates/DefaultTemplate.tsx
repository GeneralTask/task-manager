import React from 'react'
import ReactTooltip from 'react-tooltip'
import { Colors } from '../../styles'
import Navbar from '../views/NavigationView'
import '../../styles/tooltip.css'
import styled from 'styled-components'

const DefaultTemplateContainer = styled.div`
    display: flex;
    height: '100vh',
    font-family: Switzer-Variable;
    background-color: ${Colors.gray._50};
    position: relative;
`
interface DefaultTemplateProps {
    children: React.ReactNode
}
const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    const createTooltipView = (message: string) => <span>{message}</span>
    return (
        <DefaultTemplateContainer>
            <ReactTooltip
                id="tooltip"
                effect="solid"
                delayShow={250}
                className="tooltip"
                backgroundColor={Colors.white}
                textColor={Colors.black}
                getContent={createTooltipView}
            />
            <Navbar />
            {children}
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
