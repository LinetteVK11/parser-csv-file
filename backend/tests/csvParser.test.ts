import { parseCsv } from "../src/csvParser";

describe("CSV parser", () => {
  test("parses the supplied CSV format and handles BOM", () => {
    const csv = Buffer.from(
      `\uFEFF"postId",id,name,email,body
1,1,Test Name,test@example.com,Test body
1,2,Another Name,another@example.com,Another body`
    );

    expect(parseCsv(csv)).toEqual([
      {
        postId: 1,
        id: 1,
        name: "Test Name",
        email: "test@example.com",
        body: "Test body"
      },
      {
        postId: 1,
        id: 2,
        name: "Another Name",
        email: "another@example.com",
        body: "Another body"
      }
    ]);
  });

  test("rejects empty CSV", () => {
    expect(() => parseCsv(Buffer.from(""))).toThrow("CSV file is empty");
  });

  test("rejects missing required column", () => {
    const csv = Buffer.from(
      `postId,id,name,email
1,1,Test,test@example.com`
    );

    expect(() => parseCsv(csv)).toThrow(
      "Missing required column: body"
    );
  });

  test("rejects duplicate IDs", () => {
    const csv = Buffer.from(
      `postId,id,name,email,body
1,1,A,a@test.com,Body
1,1,B,b@test.com,Body`
    );

    expect(() => parseCsv(csv)).toThrow("Duplicate id 1 found in CSV");
  });

  test("rejects invalid IDs", () => {
    const csv = Buffer.from(
      `postId,id,name,email,body
1,abc,A,a@test.com,Body`
    );

    expect(() => parseCsv(csv)).toThrow("id must be an integer");
  });
});