import { DateTime } from 'luxon'
import React, { MutableRefObject, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { useAppSelector } from '../../redux/hooks'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TEmailThread } from '../../utils/types'
import { removeHTMLTags, getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import ThreadContainer from './ThreadContainer'

const IconContainer = styled.div`
    margin-left: ${Spacing.margin._8}px;
`
const TitleContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`
const Title = styled.span`
    margin-left: ${Spacing.margin._8}px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Switzer-Variable;
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._600};
`
const SubTitle = styled(Title)`
    font-size: ${Typography.xSmall.fontSize};
`
const BodyPreview = styled(SubTitle)`
    color: ${Colors.gray._400};
`
const SentAtContainer = styled.span`
    margin-left: auto;
    padding-left: ${Spacing.margin._8}px;
    font-family: Switzer-Variable;
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._400};
    min-width: fit-content;
`
interface ThreadProps {
    thread: TEmailThread
    sectionScrollingRef: MutableRefObject<HTMLDivElement | null>
}
const Thread = ({ thread, sectionScrollingRef }: ThreadProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isExpanded = params.thread === thread.id
    const isSelected = useAppSelector((state) => isExpanded || state.tasks_page.selected_item_id === thread.id)

    const observer = useRef<IntersectionObserver>()
    const selectedThread = useAppSelector((state) => state.tasks_page.selected_item_id)
    const isScrolling = useRef<boolean>(false)

    // Add event listener to check if scrolling occurs in thread section
    useEffect(() => {
        const setScrollTrue = () => {
            isScrolling.current = true
        }
        sectionScrollingRef?.current?.addEventListener('scroll', setScrollTrue)
        return () => {
            sectionScrollingRef?.current?.removeEventListener('scroll', setScrollTrue)
        }
    }, [])

    //If thread selection changes, re-enable auto-scrolling for thread section
    useEffect(() => {
        if (sectionScrollingRef.current) {
            isScrolling.current = false
        }
    }, [selectedThread])

    //Auto-scroll to thread if it is selected and out of view
    const elementRef = useCallback(
        (node) => {
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (!entries[0].isIntersecting && isSelected && !isScrolling.current) {
                        node.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        })
                    }
                },
                { threshold: 1.0 }
            )
            if (node) observer.current.observe(node)
        },
        [isSelected, isScrolling.current]
    )

    const onClickHandler = useCallback(() => {
        navigate(`/messages/${thread.id}`)
    }, [params, thread])

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClickHandler, !isSelected)

    const senders = thread.emails[0]?.sender.name
    const title = `${thread.emails[0]?.subject} (${thread.emails.length})`
    const bodyDirtyHTML = thread.emails[0]?.body
    const sentAt = getHumanTimeSinceDateTime(DateTime.fromISO(thread.emails[thread.emails.length - 1]?.sent_at))

    return (
        <ThreadContainer ref={elementRef} isSelected={isSelected} onClick={onClickHandler}>
            <IconContainer>
                <Icon source={logos[thread.source.logo_v2]} size="small" />
            </IconContainer>
            <TitleContainer>
                <Title>{senders}</Title>
                <SubTitle>{title}</SubTitle>
                <BodyPreview>{removeHTMLTags(bodyDirtyHTML)}</BodyPreview>
            </TitleContainer>
            <SentAtContainer>{sentAt}</SentAtContainer>
        </ThreadContainer>
    )
}

export default Thread
