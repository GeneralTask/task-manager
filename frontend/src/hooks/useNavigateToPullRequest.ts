import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Log from '../services/api/log'

const useNavigateToPullRequest = () => {
    const navigate = useNavigate()

    const getPullRequestURL = useCallback((pullRequestID: string) => {
        navigate(`/pull-requests/${pullRequestID}`)
        Log(`task_navigate__/pull-requests/${pullRequestID}`)
        return
    }, [])

    return (pullRequestID: string) => getPullRequestURL(pullRequestID)
}

export default useNavigateToPullRequest
