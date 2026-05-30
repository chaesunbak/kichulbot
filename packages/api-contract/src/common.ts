import * as z from "zod";

export const IsoDateStringSchema = z.iso.datetime();

export const UserRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserAuthTypeSchema = z.enum(["ANONYMOUS", "EMAIL"]);
export type UserAuthType = z.infer<typeof UserAuthTypeSchema>;

export const TagCategorySchema = z.enum(["PERIOD"]);
export type TagCategory = z.infer<typeof TagCategorySchema>;
