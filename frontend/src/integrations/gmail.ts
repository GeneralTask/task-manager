import React from 'react'

interface EmailContents {
    to: string
    subject: string
    body: string
}

export const signIn = () => {

}

export const getEmails = (emailInput: string) => {
    let result = []
}

export const initGmailClient = (apiKey: string, clientID: string) => {

    const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
    const SCOPES = 'https://mail.google.com'

    const gapi = window.gapi

    gapi.client.init({
        apiKey: apiKey,
        clientId: clientID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    })

    gapi.client.load('gmail', 'v1')

}