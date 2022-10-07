import apiClient from '../../utils/api'

const Log = (event: unknown) => {
    apiClient.post(
        'log_events/',
        { event_type: JSON.stringify(event) },
        { headers: { 'Content-Type': 'application/json' } }
    )
}

export default Log
