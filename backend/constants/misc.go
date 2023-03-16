package constants

const DefaultTaskIDOrdering = 1

const AccessControlOwner = "owner"
const AccessControlReader = "reader"

// Valid strings for shared_access field in task modify request
const (
	StringSharedAccessPublic           = "public"
	StringSharedAccessDomain           = "domain"
	StringSharedAccessMeetingAttendees = "meeting_attendees"
)
