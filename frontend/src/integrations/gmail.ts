import React from 'react'

interface EmailContents {
    to: string
    subject: string
    body: string
}

export const signIn = () => {
    initGmailClient('dummy-value', '')
    getEmails()
}

export const getEmails = () => {
    // let result = []

    gapi.client.request({
        'path': 'https://people.googleapis.com/v1/people/me?requestMask.includeField=person.names',
    }).then(function (response) {
        console.log(response.result)
    }, function (reason) {
        console.log('Error: ', reason.result.error.message)
    })
}

export const initGmailClient = (apiKey: string, clientID: string): Promise<void> => {

    const GOOGLE_OAUTH_CLIENT_ID = '786163085684-uvopl20u17kp4p2vd951odnm6f89f2f6.apps.googleusercontent.com'

    const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
    const SCOPES = 'https://mail.google.com'

    const gapi = window.gapi

    return gapi.client.init({
        apiKey: apiKey,
        clientId: GOOGLE_OAUTH_CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    })
}