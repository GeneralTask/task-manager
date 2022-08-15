import React, { useEffect, useRef } from 'react'
import { iconSize, TIconSize } from '../../styles/dimensions'
import NoStyleButton from './buttons/NoStyleButton'
import checkbox from '../../../public/animations/checkbox.json'
import styled from 'styled-components'
import Lottie, { LottieRef } from 'lottie-react'

const AnimationContainer = styled.div`
    position: absolute;
    top: -50%;
    left: -50%;
    width: ${iconSize.large};
    height: ${iconSize.large};
    pointer-events: none;
`

const SlightlyStyledButton = styled(NoStyleButton)<{ size: TIconSize }>`
    position: relative;
    flex-shrink: 0;
    width: ${({ size }) => iconSize[size]};
    height: ${({ size }) => iconSize[size]};
`

interface GTCheckboxProps {
    isChecked: boolean
    onChange: (checked: boolean) => void
    size?: TIconSize
    disabled?: boolean
}
const GTCheckbox = ({ isChecked, onChange, size, disabled }: GTCheckboxProps) => {
    const animRef: LottieRef = useRef(null)

    const onClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onChange(!isChecked)
        if (!isChecked) {
            animRef.current?.play()
        } else {
            animRef.current?.goToAndStop(0, true)
        }
    }

    useEffect(() => {
        if (!animRef.current) return
        animRef.current.goToAndStop(isChecked ? 26 : 0, true)
        animRef.current.setSpeed(1.5)
    }, [animRef])

    size = size || 'small'
    return (
        <SlightlyStyledButton onClick={onClickHandler} disabled={disabled} size={size}>
            <AnimationContainer>
                <Lottie
                    name="checkbox"
                    animationData={checkbox}
                    loop={false}
                    autoplay={false}
                    lottieRef={animRef}
                    initialSegment={[4, 29]}
                />
            </AnimationContainer>
        </SlightlyStyledButton>
    )
}

export default GTCheckbox
