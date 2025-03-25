import type { Feature, Model, ModelGroup, Tag } from "@/lib/db/schema";

export type ModelWithFeatures = Model & { features: Feature[] };
export type ModelWithFeaturesAndTags = ModelWithFeatures & { tags: Tag[] };
export type ModelGroupWithModelIDs = ModelGroup & { models: string[] };
