import { useQuery } from 'react-query'
import { logos } from '../../styles/images'
import { TLeaderboardRepository, TLeaderboardTeammate } from '../../utils/types'

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
}

export const useGetLeaderboardTeammates = () => {
    return useQuery<TLeaderboardTeammate[]>('leaderboard-teammates', getLeaderboardTeammates)
}

const getLeaderboardTeammates = async () => {
    // returns dummy data until backend is ready
    return Array.from({ length: 20 }).map((_, i) => ({
        id: i.toString(),
        name: `Scott ${i}`,
        avatar_url: 'https://avatars.githubusercontent.com/u/42781446?s=40&v=4',
        github_id: `scottmai_${i}`,
    }))
}
