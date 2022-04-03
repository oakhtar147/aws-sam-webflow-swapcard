const fetch = require("isomorphic-fetch");
const Webflow = require("webflow-api");
const { createNewExhibitors } = require("./helpers/createNewExhibitors");
const { createNewSpeakers } = require("./helpers/createNewSpeakers");
const { query, variables } = require("./helpers/query");
const { COLLECTION_ID } = require("./helpers/collection-ids");
const { createNewSessions } = require("./helpers/createNewSessions");

const ENDPOINT = `https://developer.swapcard.com/event-admin/graphql`;

exports.handler = async (event, context) => {
	const currTime = new Date();
	console.log(`Current Time: ${currTime.toTimeString()}`);

	const swapCardSessions = await fetch(ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: process.env.SWAPCARD_PERSONAL_ACCESS_TOKEN,
		},
		body: JSON.stringify({
			query,
			variables,
		}),
	}).then((res) => res.json());

	const webflow = new Webflow({ token: process.env.WEBFLOW_ACCESS_TOKEN });

	// get all the items for a collection
	const getSessionItems = webflow.items(
		{ collectionId: COLLECTION_ID.sessions },
		{ limit: 100 }
	);

	const getExhibitorItems = webflow.items(
		{ collectionId: COLLECTION_ID.exhibitors },
		{ limit: 100 }
	);

	const getSpeakerItems = webflow.items(
		{ collectionId: COLLECTION_ID.speakers },
		{ limit: 100 }
	);

	// each of these are mutate by the POST API calls to webflow below
	// we need the newly created item in the collection
	// to be able to create a new session
	let exhibitors = [];
	let speakers = [];

	let sessions = [];

	try {
		[sessions, exhibitors, speakers] = await Promise.all([
			getSessionItems,
			getExhibitorItems,
			getSpeakerItems,
		]);
	} catch (e) {
		console.log(e);
	}

	// create new speakers
	console.log("\nCREATING NEW SPEAKERS...");
	await createNewSpeakers(webflow, speakers, swapCardSessions);

	// create new exhibitors
	console.log("CREATING NEW EXHIBITORS...");
	await createNewExhibitors(webflow, exhibitors, swapCardSessions, speakers);

	// create new sessions
	console.log("CREATING NEW SESSIONS...\n");
	await createNewSessions(
		webflow,
		sessions,
		swapCardSessions,
		speakers,
		exhibitors
	);

	return { message: "Success" };
};