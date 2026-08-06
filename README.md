# it-outsourcing-kuwait
I.T. Outsourcing positions in Kuwait

## Candidate results portal

`portal.html` provides the public candidate login page. It sends only the
Candidate ID and password to the protected Supabase Edge Function and renders
the sanitized application history returned by that function.

Do not place candidate records, reports, credentials, password hashes, or
Supabase secret keys in this repository. The portal source intentionally
contains no test credentials or database keys.
