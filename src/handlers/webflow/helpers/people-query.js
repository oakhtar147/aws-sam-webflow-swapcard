const getPeopleQuery = `
query getEventPeopleData($eventId: ID!, $cursor: CursorPaginationInput) {
  eventPerson(eventId: $eventId, cursor: $cursor) {
    totalCount
    nodes {
      id
      firstName
      lastName
      jobTitle
      biography
      organization
      photoUrl
      groups {
        name
      }
      socialNetworks {
        type
        profile
      }
      fields {
        __typename
        ... on SelectField {
          definition {
            name
          }
          value
        }
      }
    }
  }
}
`;

const getPeopleVariables = {
  eventId: `RXZlbnRfODEyMjIx`,
  cursor: {
    first: 10000
  }
};

module.exports = {
  getPeopleQuery,
  getPeopleVariables
};
