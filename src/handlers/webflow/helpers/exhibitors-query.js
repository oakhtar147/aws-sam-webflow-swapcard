const getExhibitorsQuery = `
  query getEventExhibitorsData($eventId: String!) {
    exhibitors(eventId: $eventId, page: 1, pageSize: 1000) {
      id
      name
      type
      booth
      banner {
        imageUrl
      }
      logoUrl
      backgroundImageUrl
      description
      websiteUrl
      members(eventId: $eventId, page: 1, pageSize: 1000) {
        id
        firstName
        lastName
      }
      socialNetworks {
        profile
        type
      }
      address {
        city
        country
        place
        state
        street
        zipCode
      }
    }
  }
`;

const getExhibitorVariables = {
  eventId: `RXZlbnRfODEyMjIx`
};

module.exports = {
  getExhibitorsQuery,
  getExhibitorVariables
};
