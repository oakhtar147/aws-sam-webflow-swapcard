const { COLLECTION_ID } = require("./collection-ids");
const { makeid } = require("./randomstring");

async function createNewSpeakers(webflow, speakers, swapCardSessions) {
	const SPEAKERS_IN_WEBFLOW_COLLECTION = speakers.items;
	const SPEAKERS_IN_SWAPCARD_SESSIONS = swapCardSessions.data.plannings.map(
		(p) => p.speakers
	);

	const swapCardIdsInWebflow = SPEAKERS_IN_WEBFLOW_COLLECTION.map(
		(s) => s["swapcard-id"]
	);

	for (const speaker of SPEAKERS_IN_SWAPCARD_SESSIONS[0]) {
		// if we do not find the speaker in webflow...
		if (!swapCardIdsInWebflow.includes(speaker.id)) {
			// we create this speaker in webflow
			try {
				const newSpeaker = await webflow.createItem(
					{
						collectionId: COLLECTION_ID.speakers,
						fields: {
							_archived: false,
							_draft: false,
							"swapcard-id": speaker.id,
							name: speaker.firstName,
							"nom-de-familie": speaker.lastName, // lastName
							slug:
								`${speaker.firstName} ${speaker.lastName}`.replace(" ", "-") +
								makeid(5),
							"role-titre-professionnel": speaker.jobTitle,
							biographie: speaker.biography,
							company: speaker.organization,
							"photo-portrait-du-de-la-conferencier-ere": {
								url: speaker.photoUrl,
							},
							facebook:
								speaker.socialNetworks.find((sn) => sn.type === "FACEBOOK")
									?.profile ?? ``,
							linkedin:
								speaker.socialNetworks.find((sn) => sn.type === "LINKEDIN")
									?.profile ?? ``,
							instagram:
								speaker.socialNetworks.find((sn) => sn.type === "INSTAGRAM")
									?.profile ?? ``,
							twitter:
								speaker.socialNetworks.find((sn) => sn.type === "TWITTER")
									?.profile ?? ``,
						},
					},
					{ live: true }
				);

				// on complete, we push the new speaker
				speakers.items.push(newSpeaker);
			} catch (e) {
				console.log(e);
			}
		}
	}
}

module.exports = {
	createNewSpeakers,
};
