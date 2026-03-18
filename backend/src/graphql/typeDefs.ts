const typeDefs = `#graphql
  type Condolence {
    id: ID!
    relationship: String!
    howMet: String!
    message: String!
    photoUrl: String
    photoWidth: Int
    photoHeight: Int
    isPublic: Boolean!
    isPinned: Boolean!
    pinnedAt: String
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    admin: Admin!
  }

  type Admin {
    id: Int!
    username: String!
  }

  type DeleteResult {
    success: Boolean!
    deletedCount: Int!
  }

  type DownloadUrl {
    id: ID!
    url: String!
  }

  type PhotoLimits {
    minWidth: Int!
    minHeight: Int!
    maxWidth: Int!
    maxHeight: Int!
  }

  type Query {
    condolences(limit: Int, offset: Int): [Condolence!]!
    condolence(id: ID!): Condolence
    photos: [Condolence!]!
    photoLimits: PhotoLimits!
  }

  type Mutation {
    createCondolence(
      relationship: String!
      howMet: String!
      message: String!
      isPublic: Boolean!
    ): Condolence!

    adminLogin(username: String!, password: String!): AuthPayload!

    updateCondolence(
      id: ID!
      relationship: String
      howMet: String
      message: String
    ): Condolence!

    togglePinCondolence(id: ID!): Condolence!

    deleteCondolence(id: ID!): DeleteResult!
    batchDeleteCondolences(ids: [ID!]!): DeleteResult!

    batchDownloadPhotos(ids: [ID!]!): [DownloadUrl!]!
  }
`;

export default typeDefs;
