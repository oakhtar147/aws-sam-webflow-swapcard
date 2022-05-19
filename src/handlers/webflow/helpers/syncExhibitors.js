const { COLLECTION_ID } = require("./collection-ids");
const { generateHash } = require("./generate-hash");
const {
  webflowRateLimiterWorkaround
} = require("./webflowAPI-ratelimit-workaround");

async function syncExhibitors(
  webflow,
  exhibitors,
  swapCardExhibitors,
  speakers
) {
  const EXHIBITORS_IN_WEBFLOW_COLLECTION = exhibitors.items;
  const EXHIBITORS_IN_SWAPCARD = swapCardExhibitors.data.exhibitors;

  const swapCardIdsInWebflow = EXHIBITORS_IN_WEBFLOW_COLLECTION.map(
    (s) => s["swapcard-id"]
  );

  //creates an object mapping of the form {swapcardCardId: webflowId}
  const idMap = EXHIBITORS_IN_WEBFLOW_COLLECTION.reduce(
    (a, v) => ({ ...a, [v["swapcard-id"]]: v._id }),
    {}
  );

  const SPEAKER_NAMES_IN_WEBFLOW = speakers.items.map((speaker) => ({
    firstName: speaker.name.trim(),
    lastName: speaker["nom-de-familie"].trim()
  }));

  for (const ex of EXHIBITORS_IN_SWAPCARD) {
    // if we do not find the exhibitors in webflow...
    if (!swapCardIdsInWebflow.includes(ex.id)) {
      // we create this user in webflow
      try {
        const newExhibitor = await webflowRateLimiterWorkaround({
          webflow,
          collectionId: COLLECTION_ID.exhibitors,
          callback: async () =>
            webflow.createItem(
              {
                collectionId: COLLECTION_ID.exhibitors,
                fields: {
                  _archived: false,
                  _draft: false,
                  "swapcard-id": ex.id,
                  name: ex.name,
                  description: ex.description,
                  "type-de-partenaire": ex.type, // 'we need all these'
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
                  hash: generateHash(ex),
                  facebook: encodeURI(
                    ex.socialNetworks
                      .find(
                        (sn) => sn.type === "FACEBOOK" && sn.profile !== null
                      )
                      ?.profile.replace(/^/, "facebook.com/") ?? ``
                  ),
                  linkedin: encodeURI(
                    ex.socialNetworks
                      .find(
                        (sn) => sn.type === "LINKEDIN" && sn.profile !== null
                      )
                      ?.profile.replace(/^/, "linkedin.com/company/") ?? ``
                  ),
                  instagram: encodeURI(
                    ex.socialNetworks
                      .find(
                        (sn) => sn.type === "INSTAGRAM" && sn.profile !== null
                      )
                      ?.profile.replace(/^/, "instagram.com/") ?? ``
                  ),
                  twitter: encodeURI(
                    ex.socialNetworks
                      .find(
                        (sn) => sn.type === "TWITTER" && sn.profile !== null
                      )
                      ?.profile.replace(/^/, "twitter.com/") ?? ``
                  ),
                  members: findSpeakers(ex, SPEAKER_NAMES_IN_WEBFLOW, speakers)
                }
              },
              { live: true }
            )
        });

        // on complete, we update the exhibitors
        exhibitors.items.push(newExhibitor);
        swapCardIdsInWebflow.push(ex.id);

        updateMembers(webflow, newExhibitor);
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const exhibitorToBeUpdated = EXHIBITORS_IN_WEBFLOW_COLLECTION.find(
          (exhibitor) => exhibitor["swapcard-id"] === ex.id
        );

        if (generateHash(ex) !== exhibitorToBeUpdated.hash) {
          const updatedExhibitor = await webflowRateLimiterWorkaround({
            webflow,
            collectionId: COLLECTION_ID.exhibitors,
            callback: async () =>
              webflow.patchItem(
                {
                  collectionId: COLLECTION_ID.exhibitors,
                  itemId: idMap[ex.id],
                  fields: {
                    _archived: false,
                    _draft: false,
                    "swapcard-id": ex.id,
                    name: ex.name,
                    description: ex.description,
                    "type-de-partenaire": ex.type, // 'we need all these'
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
                    hash: generateHash(ex),
                    facebook: encodeURI(
                      ex.socialNetworks
                        .find(
                          (sn) => sn.type === "FACEBOOK" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "facebook.com/") ?? ``
                    ),
                    linkedin: encodeURI(
                      ex.socialNetworks
                        .find(
                          (sn) => sn.type === "LINKEDIN" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "linkedin.com/company/") ?? ``
                    ),
                    instagram: encodeURI(
                      ex.socialNetworks
                        .find(
                          (sn) => sn.type === "INSTAGRAM" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "instagram.com/") ?? ``
                    ),
                    twitter: encodeURI(
                      ex.socialNetworks
                        .find(
                          (sn) => sn.type === "TWITTER" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "twitter.com/") ?? ``
                    ),
                    members: findSpeakers(
                      ex,
                      SPEAKER_NAMES_IN_WEBFLOW,
                      speakers
                    )
                  }
                },
                { live: true }
              )
          });

          //Update the exhibitor in the exhibitors array
          const exhibitorIndex = exhibitors.items.findIndex((exhibitor) => {
            return exhibitor._id === updatedExhibitor._id;
          });
          exhibitors.items.splice(exhibitorIndex, 1, updatedExhibitor);
          updateMembers(webflow, updatedExhibitor);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
}

// update the members to have member of field set to this exhibitor id
async function updateMembers(webflow, exhibitor) {
  for (const id of exhibitor.members) {
    await webflowRateLimiterWorkaround({
      webflow,
      collectionId: COLLECTION_ID.speakers,
      callback: async () =>
        await webflow.patchItem(
          {
            collectionId: COLLECTION_ID.speakers,
            itemId: id,
            fields: {
              "member-of": exhibitor._id
            }
          },
          { live: true }
        )
    });
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
  syncExhibitors
};
