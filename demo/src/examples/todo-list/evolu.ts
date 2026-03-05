import * as Evolu from "@evolu/common";
import { createUseEvolu } from "@evolu/react";
import { evoluReactWebDeps } from "@evolu/react-web";

const TodoId = Evolu.id("Todo");
type TodoId = typeof TodoId.Type;

export const Schema = {
  todo: {
    id: TodoId,
    title: Evolu.NonEmptyString100,
    isCompleted: Evolu.nullOr(Evolu.SqliteBoolean),
  },
};

export const evolu = Evolu.createEvolu(evoluReactWebDeps)(Schema, {
  name: Evolu.SimpleName.orThrow("demo-evolu"),
});

export const useEvolu = createUseEvolu(evolu);

evolu.subscribeError(() => {
  const error = evolu.getError();
  if (!error) return;
  console.error("Evolu error:", error);
});

export const todosQuery = evolu.createQuery((db) =>
  db
    .selectFrom("todo")
    .select(["id", "title", "isCompleted"])
    .where("isDeleted", "is not", Evolu.sqliteTrue)
    .where("title", "is not", null)
    .$narrowType<{ title: Evolu.kysely.NotNull }>()
    .orderBy("createdAt"),
);

export type TodosRow = typeof todosQuery.Row;

export const formatTypeError = Evolu.createFormatTypeError<
  Evolu.MinLengthError | Evolu.MaxLengthError
>((error): string => {
  switch (error.type) {
    case "MinLength":
      return `Text must be at least ${error.min} character${error.min === 1 ? "" : "s"} long`;
    case "MaxLength":
      return `Text is too long (maximum ${error.max} characters)`;
  }
});

export { Evolu };
export { EvoluProvider, useQuery } from "@evolu/react";
