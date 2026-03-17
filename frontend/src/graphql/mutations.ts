import { gql } from "@apollo/client";

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($username: String!, $password: String!) {
    adminLogin(username: $username, password: $password) {
      token
      admin {
        id
        username
      }
    }
  }
`;

export const UPDATE_CONDOLENCE = gql`
  mutation UpdateCondolence(
    $id: ID!
    $relationship: String
    $howMet: String
    $message: String
  ) {
    updateCondolence(
      id: $id
      relationship: $relationship
      howMet: $howMet
      message: $message
    ) {
      id
      relationship
      howMet
      message
      photoUrl
      createdAt
    }
  }
`;

export const DELETE_CONDOLENCE = gql`
  mutation DeleteCondolence($id: ID!) {
    deleteCondolence(id: $id) {
      success
      deletedCount
    }
  }
`;

export const BATCH_DELETE_CONDOLENCES = gql`
  mutation BatchDeleteCondolences($ids: [ID!]!) {
    batchDeleteCondolences(ids: $ids) {
      success
      deletedCount
    }
  }
`;

export const TOGGLE_PIN_CONDOLENCE = gql`
  mutation TogglePinCondolence($id: ID!) {
    togglePinCondolence(id: $id) {
      id
      isPinned
      pinnedAt
    }
  }
`;

export const BATCH_DOWNLOAD_PHOTOS = gql`
  mutation BatchDownloadPhotos($ids: [ID!]!) {
    batchDownloadPhotos(ids: $ids) {
      id
      url
    }
  }
`;
