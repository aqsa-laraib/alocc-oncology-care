# ALOCC-ABHA Linked Oncology Care Copilot

ALOCC brings oncology records, clinician-reviewed prescriptions, follow-ups, medicine comparisons, and genomic panel referrals into one care workspace.

**Live website:** [aqsa-laraib.github.io/alocc-oncology-care](https://aqsa-laraib.github.io/alocc-oncology-care/)

**System design:** [Ideal architecture and backend flow](docs/ARCHITECTURE.md)

## Project scope

This repository hosts a standalone frontend on GitHub Pages. Its workflows run in the browser using illustrative patient records and local storage. No backend, external API keys, account authentication, or live health-service connections are required to explore it.

The interface takes visual inspiration from Indian public-service portals. ALOCC is an independent concept portal and is not affiliated with the Government of India or the National Medical Commission.

The backend described in the architecture document is the proposed complete system. It is not deployed by this repository. The original development workspace also contains a separate Python/FastAPI backend; its files are not included in this frontend repository.

## Features

- **Clinician workspace:** assigned patients, ABHA-format linking, consent requests, longitudinal records, consultation transcription, structured drafts, prescription review and signing.
- **Patient workspace:** records, prescriptions, medicine price comparisons, appointments, follow-up messages, consent decisions, messaging preferences, and lab referrals.
- **Care coordination:** rescheduling, cancellation, scheduled-message walkthroughs, patient replies, and care-team alerts.
- **Genomic testing:** missing-biomarker calculation, sample filtering, ranked panel suggestions, referral creation, and result entry.
- **Administration:** panel catalogue updates, cancer-to-biomarker configuration, and a local activity log.

All changes are saved in the same browser. Switching workspaces lets you follow an action from the clinician view to the patient or administrator view.

## Quick start

Open the [live website](https://aqsa-laraib.github.io/alocc-oncology-care/), choose a care profile, and select **Open care workspace**.

Available profiles:

- **Dr. Rao:** Asha Verma and Ravi Kumar.
- **Dr. Mehta:** Meera Nair.
- **Patients:** Asha, Ravi, and Meera.
- **Administrator:** panel configuration and activity log.

There is no password step. Profile selection is a presentation control, not secure authentication.

## Run locally

Clone the repository and serve its root directory:

```sh
git clone https://github.com/aqsa-laraib/alocc-oncology-care.git
cd alocc-oncology-care
python -m http.server 4173
```

Open `http://localhost:4173`. No build step or package installation is needed.

To reset the sample records, open the browser's developer console on the site and run:

```js
localStorage.removeItem('alocc-care-v1');
location.reload();
```

## Suggested walkthrough

1. Open Dr. Rao's workspace and inspect Asha's records and consent history.
2. Open **Consultation**, use the prefilled transcript, and create a structured draft. Check highlighted uncertain fields, edit the note, and sign it.
3. Switch to Asha's workspace to view the released prescription and compare illustrative medicine prices.
4. Return to Dr. Rao's **Follow-ups** tab to inspect appointments, reschedule them, and advance the reminder timeline.
5. Open **Lab panels**, compute the testing gap, select a panel, and create a referral. Enter results to see them appear in the patient timeline.
6. For consent: open Dr. Mehta, link Meera's ABHA-format identifier, and request records. Switch to Meera to approve or revoke the request.
7. Open the administrator profile to inspect panels, biomarkers, and recorded actions.

## Frontend implementation

```text
.
├── index.html             # Layout, styles, views, and interaction handlers
├── care-store.js          # Sample records, local persistence, workflow responses
├── .nojekyll              # Direct static-file serving on GitHub Pages
├── README.md
└── docs/
    └── ARCHITECTURE.md     # Proposed full-system design and end-to-end flow
```

`index.html` calls `localApi()` in `care-store.js`. These calls update browser state rather than making HTTP requests to a server. Data is stored under `alocc-care-v1`.

GitHub Pages publishes the `main` branch from the repository root. Website files use relative asset paths so they work under the `/alocc-oncology-care/` project URL.

## Current boundaries

- ABHA linking checks identifier format; it does not verify identity with ABDM.
- Record exchange and consent transitions are browser-local illustrations.
- Prescription signing represents a workflow state; it is not a cryptographic or legally verified signature.
- Medicine prices and lab details are illustrative, not live provider quotes or accreditation verification.
- Calendar identifiers and message statuses do not create Google Calendar events or send WhatsApp messages.
- Care-team alerts stay in the browser and do not contact a clinician.
- Speech recognition depends on browser support and permission.
- Local storage is neither encrypted clinical storage nor a multi-user database. Records do not synchronize across devices.

Use illustrative information only. The current site is not a clinical system.

## Next implementation stage

Replace browser-local workflow responses with authenticated backend endpoints, persist records in a server database, add durable background processing, and connect approved external providers. The [architecture document](docs/ARCHITECTURE.md) describes these components, their responsibilities, consent checks, and the ideal care journey.
