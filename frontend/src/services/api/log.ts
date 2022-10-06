import apiClient from '../../utils/api'

const Log = (event_type: string, event: string) => {
    apiClient.post('log_events/', { [event_type]: event })
}

export default Log
