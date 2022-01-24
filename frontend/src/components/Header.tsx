import { LANDING_PATH } from '../constants'
import React from 'react'
import { TEXT_BLACK, TEXT_BLACK_HOVER } from '../helpers/styles'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const HeaderDiv = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`
const Logo = styled.button`
    border: none;
    text-decoration: none;
    cursor: pointer;
    color: ${TEXT_BLACK};
    font-weight: bold;
    font-size: 32px;
    margin: 16px 0 0 20px;
    background-color: white;
    &:hover {
        color: ${TEXT_BLACK_HOVER};
    }
`

const LegacyHeader: React.FC = () => (
    <HeaderDiv>
        <Link to={LANDING_PATH}>
            <Logo>General Task</Logo>
        </Link>
    </HeaderDiv>
)

export default React.memo(LegacyHeader)
