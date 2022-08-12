import React, { useEffect, useRef, useState } from 'react'
import { iconSize, TIconSize } from '../../styles/dimensions'
import NoStyleButton from './buttons/NoStyleButton'
import lottie, { AnimationItem } from 'lottie-web'
import checkbox from '../../../public/animations/checkbox.json'
import styled from 'styled-components'

const AnimationContainer = styled.div<{ size: TIconSize }>`
    position: relative;
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
    const animationContainerRef = useRef<HTMLDivElement>(null)
    const [animation, setAnimation] = useState<AnimationItem>()

    const onClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onChange(!isChecked)
        if (!isChecked) {
            animation?.play()
        } else {
            animation?.goToAndStop(0, true)
        }
    }
    useEffect(() => {
        if (animationContainerRef.current) {
            setAnimation(
                lottie.loadAnimation({
                    name: 'checkbox',
                    container: animationContainerRef.current,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    animationData: checkbox,
                })
            )
        }
        return () => {
            animation?.destroy()
        }
    }, [])

    useEffect(() => {
        animation?.goToAndStop(isChecked ? animation.totalFrames : 0, true)
    }, [animation])

    size = size || 'large'
    return (
        <NoStyleButton onClick={onClickHandler} disabled={disabled}>
            <AnimationContainer ref={animationContainerRef} size={size} />
            {/* <Icon size={size} source={isChecked ? icons.task_complete : icons.task_incomplete} /> */}
        </NoStyleButton>
    )
}

export default GTCheckbox
