import { DateTime } from 'luxon'
import React, { MutableRefObject, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { Colors, Spacing, Typography } from '../../styles'
import { TEmailThread } from '../../utils/types'
import { removeHTMLTags, getHumanDateTime } from '../../utils/utils'
import ThreadContainer from './ThreadContainer'

const TitleContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`
const Title = styled.span<{ bold: boolean }>`
    margin-left: ${Spacing.margin._8};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._600};
    font-weight: ${(props) => (props.bold ? Typography.weight._600 : Typography.weight._400)};
`
const SubTitle = styled(Title)`
    font-size: ${Typography.xSmall.fontSize};
`
const BodyPreview = styled(SubTitle)`
    color: ${Colors.gray._400};
`
const SentAtContainer = styled.span`
    margin-left: auto;
    padding-left: ${Spacing.margin._8};
    font-size: ${Typography.small.fontSize};
    color: ${Colors.gray._400};
    min-width: fit-content;
`
interface ThreadProps {
    thread: TEmailThread
    sectionScrollingRef: MutableRefObject<HTMLDivElement | null>
}

const cleanPreviewText = (html: string) => {
    const trimmedText = removeHTMLTags(html).trim()
    const spacedText = trimmedText.replaceAll('\u00a0', ' ')
    return spacedText
}

const Thread = ({ thread, sectionScrollingRef }: ThreadProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const isSelected = params.thread === thread.id

    const observer = useRef<IntersectionObserver>()
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
    }, [params.thread])

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
        navigate(`/messages/${params.mailbox}/${thread.id}`)
    }, [params, thread])

    useKeyboardShortcut(KEYBOARD_SHORTCUTS.SELECT, onClickHandler, !isSelected)

    const senders = thread.emails[0]?.sender.name
    const threadCountString = thread.emails.length > 1 ? `(${thread.emails.length})` : ''
    const title = `${threadCountString} ${thread.emails[0]?.subject}`
    const bodytext = thread.emails[thread.emails.length - 1]?.body
    const sentAt = getHumanDateTime(DateTime.fromISO(thread.emails[thread.emails.length - 1]?.sent_at))
    const isUnread = thread.emails.some((email) => email.is_unread)

    return (
        <ThreadContainer ref={elementRef} isSelected={isSelected} isUnread={isUnread} onClick={onClickHandler}>
            <TitleContainer>
                <Title bold={isUnread}>{senders}</Title>
                <SubTitle bold={isUnread}>{title}</SubTitle>
                <BodyPreview bold={false}>{cleanPreviewText(bodytext)}</BodyPreview>
            </TitleContainer>
            <SentAtContainer>{sentAt}</SentAtContainer>
        </ThreadContainer>
    )
}

export default Thread
