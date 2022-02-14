const REACT_APP_FRONTEND_BASE_URL = 'http://localhost:19006'

export const getHeaders = (): Record<string, string> => {
    const date = new Date()
    return {
        'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
        'Access-Control-Allow-Headers':
            'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
        'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
        'Timezone-Offset': date.getTimezoneOffset().toString(),
    }
}

