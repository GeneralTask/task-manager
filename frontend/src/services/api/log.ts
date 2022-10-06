import apiClient from '../../utils/api'

const Log = (event: string) => {
    apiClient.post('log_events/', { event_type: event })
}

export default Log
