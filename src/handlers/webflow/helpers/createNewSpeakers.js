const { COLLECTION_ID } = require("./collection-ids");
const { makeid } = require("./randomstring");

async function createNewSpeakers(webflow, speakers, swapCardPeople) {
  const SPEAKERS_IN_WEBFLOW_COLLECTION = speakers.items;
  const SPEAKERS_IN_SWAPCARD = swapCardPeople.data.eventPerson.nodes;

  const swapCardIdsInWebflow = SPEAKERS_IN_WEBFLOW_COLLECTION.map(
    (s) => s["swapcard-id"]
  );

  for (const speaker of SPEAKERS_IN_SWAPCARD) {
    if (!swapCardIdsInWebflow.includes(speaker.id)) {
      // we create this speaker in webflow
      try {
        let companyName;
        if (speaker.organization) {
          companyName = speaker.organization.replace(/\n/g, "");
        }
        const speakerOrganization = companyName || speaker.organization;

        const slugInputDetails =
          speaker.firstName +
          " " +
          speaker.lastName +
          " " +
          speakerOrganization;
        const newSlug = generateSlug(slugInputDetails);

        const newSpeaker = await webflow.createItem(
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
                  ?.profile ?? ``
            }
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
  createNewSpeakers
};
