const { makeid } = require("./randomstring");
const { COLLECTION_ID } = require("./collection-ids");

async function createNewExhibitors(
	webflow,
	exhibitors,
	swapCardSessions,
	speakers
) {
	const EXHIBITORS_IN_WEBFLOW_COLLECTION = exhibitors.items;
	const EXHIBITORS_IN_SWAPCARD_SESSIONS = swapCardSessions.data.plannings.map(
		(p) => p.exhibitors
	);

	const swapCardIdsInWebflow = EXHIBITORS_IN_WEBFLOW_COLLECTION.map(
		(s) => s["swapcard-id"]
	);

	const SWAPCARD_MEMBERS_FOR_EXHIBITION = EXHIBITORS_IN_SWAPCARD_SESSIONS.map(
		(ex) =>
			ex.map((ex2) =>
				ex2.members.map((m) => ({
					firstName: m.firstName.trim(),
					lastName: m.lastName.trim(),
				}))
			)
	).filter((s) => !!s);

	const SPEAKER_NAMES_IN_WEBFLOW = speakers.items.map((speaker) => ({
		firstName: speaker.name.trim(),
		lastName: speaker["nom-de-familie"].trim(),
	}));

	const COMMON_SPEAKERS_IDS = [];

	for (const swapcardSpeakerList of SWAPCARD_MEMBERS_FOR_EXHIBITION) {
		for (const swapcardSpeaker of swapcardSpeakerList) {
			for (const webflowSpeaker of SPEAKER_NAMES_IN_WEBFLOW) {
				if (
					swapcardSpeaker[0].firstName === webflowSpeaker.firstName &&
					swapcardSpeaker[0].lastName === webflowSpeaker.lastName
				) {
					COMMON_SPEAKERS_IDS.push(
						speakers.items.find((speaker) => {
							return (
								webflowSpeaker.firstName.trim() === speaker.name.trim() &&
								webflowSpeaker.lastName.trim() ===
									speaker["nom-de-familie"].trim()
							);
						})._id
					);
				}
			}
		}
	}

	for (const exList of EXHIBITORS_IN_SWAPCARD_SESSIONS) {
		for (const ex of exList) {
			// if we do not find the exhibitors in webflow...
			if (!swapCardIdsInWebflow.includes(ex.id)) {
				// we create this user in webflow
				try {
					const newExhibitor = await webflow.createItem(
						{
							collectionId: COLLECTION_ID.exhibitors,
							fields: {
								_archived: false,
								_draft: false,
								slug: makeid(25),
								"swapcard-id": ex.id,
								name: ex.name,
								description: ex.description,
								"type-de-partenaire": "Grand partenaire", // 'we need all these'
								location: ex.booth,
								"background-image": {
									url: ex.backgroundImageUrl,
								},
								logo: {
									url: ex.logoUrl,
								},
								"header-image": {
									url: ex.banner.imageUrl,
								},
								"site-web-du-partenaire": ex.websiteUrl, // website url
								facebook:
									ex.socialNetworks.find((sn) => sn.type === "FACEBOOK")
										?.profile ?? ``,
								linkedin:
									ex.socialNetworks.find((sn) => sn.type === "LINKEDIN")
										?.profile ?? ``,
								instagram:
									ex.socialNetworks.find((sn) => sn.type === "INSTAGRAM")
										?.profile ?? ``,
								twitter:
									ex.socialNetworks.find((sn) => sn.type === "TWITTER")
										?.profile ?? ``,
								members: COMMON_SPEAKERS_IDS,
							},
						},
						{ live: true }
					);

					// on complete, we update the exhibitors
					exhibitors.items.push(newExhibitor);

					// update the members to have member of field set to this exhibitor id
					for (const id of COMMON_SPEAKERS_IDS) {
						await webflow.patchItem(
							{
								collectionId: COLLECTION_ID.speakers,
								itemId: id,
								fields: {
									"member-of": newExhibitor._id,
								},
							},
							{ live: true }
						);
					}
				} catch (e) {
					console.log(e);
				}
			}
		}
	}
}

module.exports = {
	createNewExhibitors,
};
