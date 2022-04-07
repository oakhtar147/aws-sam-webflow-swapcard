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

  const SPEAKER_NAMES_IN_WEBFLOW = speakers.items.map((speaker) => ({
    firstName: speaker.name.trim(),
    lastName: speaker["nom-de-familie"].trim()
  }));

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
                "type-de-partenaire": "Grands Partenaires", // 'we need all these'
                location: ex.booth,
                "background-image": {
                  url: ex.backgroundImageUrl
                },
                logo: {
                  url: ex.logoUrl
                },
                "header-image": {
                  url: ex.banner.imageUrl
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
                members: findSpeakers(ex, SPEAKER_NAMES_IN_WEBFLOW, speakers)
              }
            },
            { live: true }
          );

          // on complete, we update the exhibitors
          exhibitors.items.push(newExhibitor);

          // update the members to have member of field set to this exhibitor id
          for (const id of newExhibitor.members) {
            await webflow.patchItem(
              {
                collectionId: COLLECTION_ID.speakers,
                itemId: id,
                fields: {
                  "member-of": newExhibitor._id
                }
              },
              { live: true }
            );
          }
          swapCardIdsInWebflow.push(ex.id);
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
}

//find the speakers of a particular exhibitor by matching exhibitor speakers with webflow speakers
function findSpeakers(swapcard, webflowSpeakerNames, speakers) {
  let COMMON_SPEAKERS_IDS = [];
  const swapcardSpeaker = swapcard.members.map((m) => ({
    firstName: m.firstName.trim(),
    lastName: m.lastName.trim()
  }));
  for (const individualSwapCardSpeaker of swapcardSpeaker) {
    for (const webflowSpeaker of webflowSpeakerNames) {
      if (
        individualSwapCardSpeaker &&
        individualSwapCardSpeaker.firstName === webflowSpeaker.firstName &&
        individualSwapCardSpeaker.lastName === webflowSpeaker.lastName
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
  return COMMON_SPEAKERS_IDS;
}

module.exports = {
  createNewExhibitors
};
