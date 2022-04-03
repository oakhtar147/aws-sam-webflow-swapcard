const getEventSlugQuery = `
  query getEvent($eventId: ID!) {
    event(id: $eventId) {
      slug
    }
  }
`;

const getEventSlugVariables = {
	eventId: `RXZlbnRfODEyMjIx`,
};

module.exports = {
	getEventSlugQuery,
	getEventSlugVariables,
};
