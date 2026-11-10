# Workshop development data migration

The enrollment field is `customerId`; older development documents may still contain
`providerId`. Before reseeding, drop the `workshopParticipants` collection and let
the application recreate its indexes, then seed enrollments with customer users.
Do not migrate old provider enrollments as customer enrollments without explicitly
mapping each record to a real customer account.
