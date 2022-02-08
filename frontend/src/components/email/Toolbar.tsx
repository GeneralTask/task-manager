import React from 'react'
import styled from 'styled-components'
import { TOOLBAR_BOLD, TOOLBAR_ITALIC, TOOLBAR_ORDERED_BULLETS, TOOLBAR_UNDERLINE, TOOLBAR_UNORDERED_BULLETS } from '../../constants'


const ToolbarContainer = styled.div`
    display: flex;
    background: #FFFFFF;
    border: 1px solid #F4F4F5;
    box-sizing: border-box;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.07);
    border-radius: 12px;
    padding: 6px 10px;
    width: fit-content;
    gap: 8px;
    align-items: center;
`
const ToolbarButton = styled.button`
    background: none;
	color: inherit;
	border: none;
	padding: 0;
	font: inherit;
	cursor: pointer;
	outline: inherit;
    width: 20px;
    height: 20px;
    display: flex;
    align-items : center;
    justify-content: center;
`
const ToolbarIcon = styled.img`
`
interface ToolbarProps {
    boldEvent?: () => void,
    italicEvent?: () => void,
    underlineEvent?: () => void,
    unorderedBulletEvent?: () => void,
    orderedBulletEvent?: () => void,
}
const Toolbar = (props: ToolbarProps) => {
    return <ToolbarContainer>
        {
            props.boldEvent &&
            <ToolbarButton onClick={props.boldEvent}>
                <ToolbarIcon alt="Bold" src={process.env.PUBLIC_URL + TOOLBAR_BOLD} />
            </ToolbarButton>
        }
        {
            props.italicEvent &&
            <ToolbarButton onClick={props.italicEvent}>
                <ToolbarIcon alt="Italic" src={process.env.PUBLIC_URL + TOOLBAR_ITALIC} />
            </ToolbarButton>
        }
        {
            props.underlineEvent &&
            <ToolbarButton onClick={props.underlineEvent}>
                <ToolbarIcon alt="Underline" src={process.env.PUBLIC_URL + TOOLBAR_UNDERLINE} />
            </ToolbarButton>
        }
        {
            props.unorderedBulletEvent &&
            <ToolbarButton onClick={props.unorderedBulletEvent}>
                <ToolbarIcon alt="Unordered bullet" src={process.env.PUBLIC_URL + TOOLBAR_UNORDERED_BULLETS} />
            </ToolbarButton>
        }
        {
            props.orderedBulletEvent &&
            <ToolbarButton onClick={props.orderedBulletEvent}>
                <ToolbarIcon alt="Ordered bullet" src={process.env.PUBLIC_URL + TOOLBAR_ORDERED_BULLETS} />
            </ToolbarButton>
        }
    </ToolbarContainer>
}

export default Toolbar
