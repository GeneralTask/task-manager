import { TEmail, TRecipients } from "../../../../utils/types"

import { EmailComposeType } from "../../../../utils/enums"
import { DateTime } from "luxon"

const prefixes = ['Re: ', 'Fwd: ', 'Fw: ']

export function stripSubjectPrefix(subject: string): string {
    for (const prefix of prefixes) {
        if (subject.startsWith(prefix)) {
            return subject.substring(prefix.length)
        }
    }
    return subject
}

export function attachSubjectPrefix(subject: string, composeType: EmailComposeType): string {
    let prefix = ''
    if (composeType === EmailComposeType.REPLY || composeType === EmailComposeType.REPLY_ALL) {
        prefix = 'Re: '
    }
    else if (composeType === EmailComposeType.FORWARD) {
        prefix = 'Fwd: '
    }
    return prefix + subject
}

export function getInitialRecipients(email: TEmail, composeType: EmailComposeType, userEmail: string): TRecipients {
    if (email.sender.email === userEmail) {
        if (composeType === EmailComposeType.REPLY) {
            return {
                to: email.recipients.to,
                cc: [],
                bcc: []
            }
        }
        else if (composeType === EmailComposeType.REPLY_ALL) {
            return {
                to: email.recipients.to,
                cc: email.recipients.cc,
                bcc: []
            }
        }
    }
    else {
        if (composeType === EmailComposeType.REPLY) {
            return {
                to: [{ email: email.sender.email, name: '' }],
                cc: [],
                bcc: [],
            }
        }
        else if (composeType === EmailComposeType.REPLY_ALL) {
            return {
                to: [...new Set([
                    email.sender.email,
                    ...email.recipients.to.map(recipient => recipient.email).filter(email => email !== userEmail),
                    ...email.recipients.cc.map(recipient => recipient.email).filter(email => email !== userEmail),
                ])].map(email => ({ email, name: '' })),
                cc: [],
                bcc: [],
            }
        }
    }
    return {
        to: [],
        cc: [],
        bcc: [],
    }
}

export const emailsToRecipients = (emails: string[]) => emails.map(email => ({ email, name: '' }))

export const formatSentAtDateTime = (date: string) => DateTime.fromISO(date).toLocaleString(DateTime.DATETIME_MED)
