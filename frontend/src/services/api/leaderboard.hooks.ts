import { useQuery } from 'react-query'
import { logos } from '../../styles/images'
import { TLeaderboardRepository } from '../../utils/types'

export const useGetLeaderboardRepositories = () => {
    return useQuery<TLeaderboardRepository[]>('leaderboard-repositories', getLeaderboardRepositories)
}

const getLeaderboardRepositories = async () => {
    // returns dummy data until backend is ready
    return Array.from({ length: 20 }).map((_, i) => ({
        id: i.toString(),
        name: `Repository ${i}`,
        image_url: logos.generaltask_yellow_circle,
    }))
    // try {
    //     const res = await apiClient.get(`/leaderboard/repositories/`, { signal })
    //     return castImmutable(res.data)
    // } catch {
    //     throw 'getLeaderboardRepositories failed'
    // }
}
