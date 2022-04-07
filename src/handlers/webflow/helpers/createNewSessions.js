const { COLLECTION_ID } = require("./collection-ids");
const { getSujets } = require("./getSujets");
const { makeid } = require("./randomstring");
const { sujetMapping } = require("./sujet-mapping");
const { mapping } = require("./type-mapping");

async function createNewSessions(
  webflow,
  sessions,
  eventSlug,
  swapCardSessions,
  speakers,
  exhibitors
) {
  const SESSIONS_IN_WEBFLOW_COLLECTION = sessions.items;
  const SWAPCARD_SESSIONS = swapCardSessions.data.plannings;

  const swapCardIdsInWebflow = SESSIONS_IN_WEBFLOW_COLLECTION.map(
    (s) => s["swapcard-id"]
  );

  const SWAPCARD_MEMBERS_NAMES = SWAPCARD_SESSIONS.map((s) => {
    return {
      id: s.id,
      details: s.speakers.map((speaker) => ({
        firstName: speaker.firstName,
        lastName: speaker.lastName
      }))
    };
  });

  const SWAPCARD_EXHIBITORS_NAMES = SWAPCARD_SESSIONS.map((s) => {
    return {
      id: s.id,
      details: s.exhibitors.map((ex) => ({
        name: ex.name
      }))
    };
  }).filter((x) => !!x.details);

  const SPEAKER_NAMES_IN_WEBFLOW = speakers.items.map((speaker) => ({
    firstName: speaker.name.trim(),
    lastName: speaker["nom-de-familie"].trim()
  }));

  const EXHIBITOR_NAMES_IN_WEBFLOW = exhibitors.items.map((ex) => ({
    name: ex.name.trim()
  }));

  const thematiques = await getSujets(webflow);
  // console.log(thematiques);

  for (const session of SWAPCARD_SESSIONS) {
    let COMMON_SPEAKERS_IDS = [];
    let EXHIBITOR_IDS = [];
    let THEMES = [];

    const sessionThemes = session.categories;

    // if we do not find the session in webflow...
    if (!swapCardIdsInWebflow.includes(session.id)) {
      // for each of that theme
      for (const theme of sessionThemes) {
        // we loop through the themes in the webflow dropdown options
        for (const wfTheme of thematiques) {
          // if we find the name of the current swapcard theme match
          // the current webflow theme in the options list
          if (sujetMapping[theme] === wfTheme.name) {
            // we add the webflow theme id into our session themes array of references
            THEMES.push(wfTheme.id);
          }
        }
      }

      // find speakers for the session by comparing names
      // in swapcard and then finding the webflow id for that
      // name
      for (const swapcardSpeaker of SWAPCARD_MEMBERS_NAMES.find(
        (s) => s.id === session.id
      ).details) {
        for (const webflowSpeaker of SPEAKER_NAMES_IN_WEBFLOW) {
          if (
            swapcardSpeaker.firstName === webflowSpeaker.firstName &&
            swapcardSpeaker.lastName === webflowSpeaker.lastName
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

      // find exhibitors for the session by comparing names
      // in swapcard and then finding the webflow id for that
      // name
      const sessionExhibitors = SWAPCARD_EXHIBITORS_NAMES.filter(
        (s) => s.id === session.id
      );

      for (const exhibitor of sessionExhibitors) {
        for (const ex1 of exhibitor.details) {
          // console.log(ex1.name);
          for (const webflowExhibitor of EXHIBITOR_NAMES_IN_WEBFLOW) {
            if (ex1.name.trim() === webflowExhibitor.name.trim()) {
              EXHIBITOR_IDS.push(
                exhibitors.items.find((ex) => {
                  return webflowExhibitor.name.trim() === ex.name.trim();
                })._id
              );
            }
          }
        }
      }

      // we create this user in webflow
      try {
        await webflow.createItem(
          {
            collectionId: COLLECTION_ID.sessions,
            fields: {
              _archived: false,
              _draft: false,
              name: session.title,
              "swapcard-id": session.id,
              slug: makeid(7),
              description: session.description,
              "thumbnail-2": {
                url: session.bannerUrl
              },
              "start-date": `${session.beginsAt.split(" ")[0]}T00:00:00.000Z`,
              "start-time": session.beginsAt.split(" ")[1],
              "end-time": session.endsAt.split(" ")[1],
              speakers: COMMON_SPEAKERS_IDS,
              exhibitor: EXHIBITOR_IDS,
              thematiques: THEMES,
              "lieu-2": session.place,
              type: mapping[session.type],
              "add-to-my-schedule-link": `https://app.swapcard.com/event/${eventSlug}/planning/${session.id}`
            }
          },
          { live: true }
        );

        COMMON_SPEAKERS_IDS = [];
        EXHIBITOR_IDS = [];
        THEMES = [];
      } catch (e) {
        console.log(e);
      }
    }
  }
}

module.exports = {
  createNewSessions
};
