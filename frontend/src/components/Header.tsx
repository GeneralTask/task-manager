import { LANDING_PATH } from '../constants'
import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const HeaderDiv = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`
const Logo = styled.img`
    width: 48px;
    height: 48px;
    padding: 1em;
`

const LegacyHeader: React.FC = () => (
    <HeaderDiv>
        <Link to={LANDING_PATH}>
            <Logo src={`${process.env.PUBLIC_URL}/images/generaltask.svg`} />
        </Link>
    </HeaderDiv>
)

export default React.memo(LegacyHeader)
