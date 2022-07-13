import { castImmutable } from "immer"
import { useMutation } from "react-query"
import apiClient from "../../utils/api"
import { TPostFeedbackData } from "../query-payload-types"

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