import React, { useEffect, useRef } from 'react'
import { checkboxSize } from '../../styles/dimensions'
import NoStyleButton from './buttons/NoStyleButton'
import checkbox from '../../../public/animations/checkbox.json'
import styled from 'styled-components'
import Lottie, { LottieRef } from 'lottie-react'

const ANIM_SPEED = 3
const ANIM_START_FRAME = 3
const ANIM_END_FRAME = 29
const ANIM_TOTAL_FRAMES = ANIM_END_FRAME - ANIM_START_FRAME

const AnimationContainer = styled.div`
    position: absolute;
    top: -50%;
    left: -50%;
    width: ${checkboxSize.childContainer};
    height: ${checkboxSize.childContainer};
    pointer-events: none;
`

const FixedSizeButton = styled(NoStyleButton)`
    position: relative;
    min-width: ${checkboxSize.parentContainer};
    width: ${checkboxSize.parentContainer};
    height: ${checkboxSize.parentContainer};
    &:disabled {
        opacity: 0.3;
    }
`

interface GTCheckboxProps {
    isChecked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    animated?: boolean
}
const GTCheckbox = ({ isChecked, onChange, disabled, animated }: GTCheckboxProps) => {
    const animRef: LottieRef = useRef(null)

    const onClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onChange(!isChecked)
        if (!isChecked) {
            if (animated) {
                animRef.current?.play()
            } else {
                animRef.current?.goToAndStop(ANIM_END_FRAME, true)
            }
        } else {
            animRef.current?.goToAndStop(ANIM_START_FRAME, true)
        }
    }

    useEffect(() => {
        if (!animRef.current) return
        animRef.current.goToAndStop(isChecked ? ANIM_TOTAL_FRAMES : ANIM_START_FRAME, true)
        animRef.current.setSpeed(ANIM_SPEED)
    }, [])

    return (
        <FixedSizeButton onClick={onClickHandler} disabled={disabled}>
            <AnimationContainer>
                <Lottie
                    name="checkbox"
                    animationData={checkbox}
                    loop={false}
                    autoplay={false}
                    lottieRef={animRef}
                    initialSegment={[ANIM_START_FRAME, ANIM_END_FRAME]}
                />
            </AnimationContainer>
        </FixedSizeButton>
    )
}

export default GTCheckbox
