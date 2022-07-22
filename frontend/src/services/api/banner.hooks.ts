import { castImmutable } from "immer"
import { useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TMeetingBanner } from "../../utils/types"

export const useMeetingBanner = () => {
    return useQuery<TMeetingBanner>('meeting_banner', () => meetingBanner())
}
const meetingBanner = async () => {
    try {
        const res = await apiClient.get('/meeting_banner/')
        return castImmutable(res.data)
    } catch {
        throw new Error('useMeetingBanner failed')
    }
}
