import type { ModelGroup as dbModelGroup } from "@/lib/db/schema";
import type { ModelWithFeaturesAndTags } from "@/lib/db/types";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

export type ModelGroupWithModels = dbModelGroup & { models: ModelWithFeaturesAndTags[] };

export interface Model extends ModelWithFeaturesAndTags {
  icon: { light: StaticImport, dark: StaticImport };
}

export interface ModelGroup {
  id: string;
  title: string;
  models: Model[];
}
