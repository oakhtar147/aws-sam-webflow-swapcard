const { COLLECTION_ID } = require("./collection-ids");
const { generateHash } = require("./generate-hash");
const {
  webflowRateLimiterWorkaround
} = require("./webflowAPI-ratelimit-workaround");

async function syncSpeakers(webflow, speakers, swapCardPeople) {
  const SPEAKERS_IN_WEBFLOW_COLLECTION = speakers.items;
  const SPEAKERS_IN_SWAPCARD = swapCardPeople.data.eventPerson.nodes;

  //creates an object mapping of the form {swapcardCardId: webflowId}
  const idMap = SPEAKERS_IN_WEBFLOW_COLLECTION.reduce(
    (a, v) => ({ ...a, [v["swapcard-id"]]: v._id }),
    {}
  );

  // console.log(SPEAKERS_IN_WEBFLOW_COLLECTION);

  for (const speaker of SPEAKERS_IN_SWAPCARD) {
    const speakerGroups = speaker.groups.map((group) => group.name);

    if (
      !(speakerGroups.length === 1 && speakerGroups.includes("Participants"))
    ) {
      let companyName;
      if (speaker.organization) {
        companyName = speaker.organization.replace(/\n/g, "");
      }
      const speakerOrganization = companyName || speaker.organization;

      const slugInputDetails =
        speaker.firstName + " " + speaker.lastName + " " + speakerOrganization;
      const newSlug = generateSlug(slugInputDetails);

      let homepageFeature;
      if (
        speaker.fields[0] &&
        speaker.fields[0].definition.name === "Feature On Website Homepage?"
      )
        homepageFeature = speaker.fields[0].value === "false" ? false : true;

      if (!Object.keys(idMap).includes(speaker.id)) {
        // we create this speaker in webflow
        try {
          const newSpeaker = await webflowRateLimiterWorkaround({
            webflow,
            collectionId: COLLECTION_ID.speakers,
            callback: async () =>
              await webflow.createItem(
                {
                  collectionId: COLLECTION_ID.speakers,
                  fields: {
                    _archived: false,
                    _draft: false,
                    "swapcard-id": speaker.id,
                    name: speaker.firstName,
                    "nom-de-familie": speaker.lastName, // lastName
                    slug: newSlug,
                    "role-titre-professionnel": speaker.jobTitle,
                    biographie: speaker.biography,
                    company: speakerOrganization,
                    "photo-portrait-du-de-la-conferencier-ere": {
                      url: speaker.photoUrl
                    },
                    "featured-homepage": homepageFeature || false,
                    hash: generateHash(speaker),
                    facebook: encodeURI(
                      speaker.socialNetworks
                        .find(
                          (sn) => sn.type === "FACEBOOK" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "facebook.com/") ?? ``
                    ),
                    linkedin: encodeURI(
                      speaker.socialNetworks
                        .find(
                          (sn) => sn.type === "LINKEDIN" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "linkedin.com/company/") ?? ``
                    ),
                    instagram: encodeURI(
                      speaker.socialNetworks
                        .find(
                          (sn) => sn.type === "INSTAGRAM" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "instagram.com/") ?? ``
                    ),
                    twitter: encodeURI(
                      speaker.socialNetworks
                        .find(
                          (sn) => sn.type === "TWITTER" && sn.profile !== null
                        )
                        ?.profile.replace(/^/, "twitter.com/") ?? ``
                    )
                  }
                },
                { live: true }
              )
          });

          // on complete, we push the new speaker
          speakers.items.push(newSpeaker);
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          const speakerToBeUpdated = SPEAKERS_IN_WEBFLOW_COLLECTION.find(
            (sp) => sp["swapcard-id"] === speaker.id
          );
          let updatedSlug;
          if (
            speakerToBeUpdated.slug.includes(newSlug) &&
            speakerToBeUpdated.slug !== newSlug
          ) {
            updatedSlug = speakerToBeUpdated.slug;
          }

          if (generateHash(speaker) !== speakerToBeUpdated.hash) {
            const updatedSpeaker = await webflowRateLimiterWorkaround({
              webflow,
              collectionId: COLLECTION_ID.speakers,
              callback: async () =>
                await webflow.updateItem(
                  {
                    collectionId: COLLECTION_ID.speakers,
                    itemId: idMap[speaker.id],
                    fields: {
                      _archived: false,
                      _draft: false,
                      "swapcard-id": speaker.id,
                      name: speaker.firstName,
                      slug: updatedSlug || newSlug,
                      "nom-de-familie": speaker.lastName, // lastName
                      "role-titre-professionnel": speaker.jobTitle,
                      biographie: speaker.biography,
                      company: speakerOrganization,
                      "photo-portrait-du-de-la-conferencier-ere": {
                        url: speaker.photoUrl
                      },
                      "featured-homepage": homepageFeature || false,
                      hash: generateHash(speaker),
                      facebook: encodeURI(
                        speaker.socialNetworks
                          .find(
                            (sn) =>
                              sn.type === "FACEBOOK" && sn.profile !== null
                          )
                          ?.profile.replace(/^/, "facebook.com/") ?? ``
                      ),
                      linkedin: encodeURI(
                        speaker.socialNetworks
                          .find(
                            (sn) =>
                              sn.type === "LINKEDIN" && sn.profile !== null
                          )
                          ?.profile.replace(/^/, "linkedin.com/company/") ?? ``
                      ),
                      instagram: encodeURI(
                        speaker.socialNetworks
                          .find(
                            (sn) =>
                              sn.type === "INSTAGRAM" && sn.profile !== null
                          )
                          ?.profile.replace(/^/, "instagram.com/") ?? ``
                      ),
                      twitter: encodeURI(
                        speaker.socialNetworks
                          .find(
                            (sn) => sn.type === "TWITTER" && sn.profile !== null
                          )
                          ?.profile.replace(/^/, "twitter.com/") ?? ``
                      )
                    }
                  },
                  { live: true }
                )
            });

            // console.log(updatedSpeaker);
            //Update the speaker in the speakers array
            const speakerIndex = speakers.items.findIndex((speaker) => {
              return speaker._id === updatedSpeaker._id;
            });
            speakers.items.splice(speakerIndex, 1, updatedSpeaker);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
}

function generateSlug(inputString) {
  const newSlug = inputString
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/ /g, "-");
  return newSlug;
}

module.exports = {
  syncSpeakers
};
