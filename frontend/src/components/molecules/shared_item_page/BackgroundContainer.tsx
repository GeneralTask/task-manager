import styled, { css } from 'styled-components'
import { noteBackground } from '../../../styles/images'

const background = css`
    background: url(${noteBackground});
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: top left, 0px 0px;
    background-size: cover;
`

export const BackgroundContainer = styled.div`
    ${background};
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
`
