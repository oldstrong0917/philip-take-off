import { generateToken, verifyToken } from "../middleware/auth";

describe("Auth middleware", () => {
  const mockPayload = { id: 1, username: "admin" };

  test("generateToken returns a string token", () => {
    const token = generateToken(mockPayload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts
  });

  test("verifyToken decodes a valid token correctly", () => {
    const token = generateToken(mockPayload);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(mockPayload.id);
    expect(decoded.username).toBe(mockPayload.username);
  });

  test("verifyToken throws on invalid token", () => {
    expect(() => verifyToken("invalid-token")).toThrow();
  });

  test("verifyToken throws on tampered token", () => {
    const token = generateToken(mockPayload);
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(() => verifyToken(tampered)).toThrow();
  });
});
