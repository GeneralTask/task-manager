import { useMutation } from 'react-query'
import { castImmutable } from 'immer'
import apiClient from '../../utils/api'

interface TPostFeedbackData {
    feedback: string
}

export const usePostFeedback = () => {
    return useMutation(postFeedback)
}
const postFeedback = async (data: TPostFeedbackData) => {
    try {
        const res = await apiClient.post('/feedback/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('postFeedback failed')
    }
}
