import { buildSchema } from "graphql";
import typeDefs from "../graphql/typeDefs";

describe("GraphQL Schema", () => {
  test("typeDefs is valid GraphQL schema", () => {
    expect(() => buildSchema(typeDefs)).not.toThrow();
  });

  test("schema contains Condolence type", () => {
    const schema = buildSchema(typeDefs);
    const condolenceType = schema.getType("Condolence");
    expect(condolenceType).toBeDefined();
  });

  test("schema contains required queries", () => {
    const schema = buildSchema(typeDefs);
    const queryType = schema.getQueryType();
    expect(queryType).toBeDefined();
    const fields = queryType!.getFields();
    expect(fields.condolences).toBeDefined();
    expect(fields.condolence).toBeDefined();
    expect(fields.photos).toBeDefined();
    expect(fields.photoLimits).toBeDefined();
  });

  test("schema contains required mutations", () => {
    const schema = buildSchema(typeDefs);
    const mutationType = schema.getMutationType();
    expect(mutationType).toBeDefined();
    const fields = mutationType!.getFields();
    expect(fields.createCondolence).toBeDefined();
    expect(fields.adminLogin).toBeDefined();
    expect(fields.updateCondolence).toBeDefined();
    expect(fields.deleteCondolence).toBeDefined();
    expect(fields.batchDeleteCondolences).toBeDefined();
    expect(fields.batchDownloadPhotos).toBeDefined();
  });

  test("Condolence type has all required fields", () => {
    const schema = buildSchema(typeDefs);
    const condolenceType = schema.getType("Condolence");
    expect(condolenceType).toBeDefined();
    if (condolenceType && "getFields" in condolenceType) {
      const fields = condolenceType.getFields();
      expect(fields.id).toBeDefined();
      expect(fields.relationship).toBeDefined();
      expect(fields.howMet).toBeDefined();
      expect(fields.message).toBeDefined();
      expect(fields.photoUrl).toBeDefined();
      expect(fields.photoWidth).toBeDefined();
      expect(fields.photoHeight).toBeDefined();
      expect(fields.createdAt).toBeDefined();
    }
  });
});
