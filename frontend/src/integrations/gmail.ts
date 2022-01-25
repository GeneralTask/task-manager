import React from 'react'

interface EmailContents {
    to: string
    subject: string
    body: string
}

export const getEmails = (emailInput) => {
    let result = []
