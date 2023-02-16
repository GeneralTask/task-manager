import { useEffect, useRef, useState } from 'react'
import { NO_TITLE, SYNC_MESSAGES } from '../constants'

export interface TSaveData {
    onSave: (data: TModifyData) => void
    isError: boolean
    isLoading: boolean
}

export interface TModifyData {
    id: string
    title?: string
    body?: string
}

const useDebouncedEdit = ({ onSave, isError, isLoading }: TSaveData, delay: number) => {
    const timers = useRef<{ [key: string]: { timeout: NodeJS.Timeout; callback: () => void } }>({})
    const [syncIndicatorText, setSyncIndicatorText] = useState(SYNC_MESSAGES.COMPLETE)
    const [isEditing, setIsEditing] = useState(false)

    const sync = ({ id, title, body }: TModifyData) => {
        setIsEditing(false)
        const timerId = id + (title === undefined ? 'body' : 'title')
        if (title === '') title = NO_TITLE
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        onSave({ id, title, body })
    }

    const onEdit = ({ id, title, body }: TModifyData) => {
        setIsEditing(true)
        const timerId = id + (title === undefined ? 'body' : 'title')
        if (timers.current[timerId]) clearTimeout(timers.current[timerId].timeout)
        timers.current[timerId] = {
            timeout: setTimeout(() => sync({ id, title, body }), delay),
            callback: () => sync({ id, title, body }),
        }
    }

    useEffect(() => {
        return () => {
            for (const timer of Object.values(timers.current)) {
                timer.callback()
                clearTimeout(timer.timeout)
            }
        }
    }, [])

    useEffect(() => {
        if (isEditing || isLoading) {
            setSyncIndicatorText(SYNC_MESSAGES.SYNCING)
        } else if (isError) {
            setSyncIndicatorText(SYNC_MESSAGES.ERROR)
        } else {
            setSyncIndicatorText(SYNC_MESSAGES.COMPLETE)
        }
    }, [isError, isLoading, isEditing])

    return { onEdit, isEditing, syncIndicatorText }
}

export default useDebouncedEdit
