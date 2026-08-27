import { createConflict, getChanges } from "../src/diff";

const oldRecord = {
  postId: 1,
  id: 10,
  name: "John",
  email: "john@test.com",
  body: "Old body"
};

test("detects changed fields", () => {
  const newRecord = {
    ...oldRecord,
    name: "John Updated",
    body: "New body"
  };

  expect(getChanges(oldRecord, newRecord)).toEqual([
    {
      field: "name",
      oldValue: "John",
      newValue: "John Updated"
    },
    {
      field: "body",
      oldValue: "Old body",
      newValue: "New body"
    }
  ]);
});

test("returns no changes for identical records", () => {
  expect(getChanges(oldRecord, oldRecord)).toHaveLength(0);
});

test("creates a conflict", () => {
  const conflict = createConflict(oldRecord, {
    ...oldRecord,
    email: "new@test.com"
  });

  expect(conflict?.id).toBe(10);
  expect(conflict?.changes[0]).toEqual({
    field: "email",
    oldValue: "john@test.com",
    newValue: "new@test.com"
  });
});