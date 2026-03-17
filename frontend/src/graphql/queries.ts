import { gql } from "@apollo/client";

export const GET_PHOTOS = gql`
  query GetPhotos {
    photos {
      id
      photoUrl
      photoWidth
      photoHeight
      relationship
      message
      isPinned
      createdAt
    }
  }
`;

export const GET_CONDOLENCES = gql`
  query GetCondolences($limit: Int, $offset: Int) {
    condolences(limit: $limit, offset: $offset) {
      id
      relationship
      howMet
      message
      photoUrl
      photoWidth
      photoHeight
      isPublic
      isPinned
      createdAt
    }
  }
`;

export const GET_CONDOLENCE = gql`
  query GetCondolence($id: ID!) {
    condolence(id: $id) {
      id
      relationship
      howMet
      message
      photoUrl
      photoWidth
      photoHeight
      isPublic
      isPinned
      createdAt
    }
  }
`;

export const GET_PHOTO_LIMITS = gql`
  query GetPhotoLimits {
    photoLimits {
      minWidth
      minHeight
      maxWidth
      maxHeight
    }
  }
`;
