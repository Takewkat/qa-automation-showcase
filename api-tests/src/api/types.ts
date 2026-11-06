import type { components } from "@job-offer/generated/schema";

type Schemas = components["schemas"];

export type Address = Schemas["Address"];
export type Location = Schemas["Location"];
export type SalaryEntry = Schemas["SalaryEntry"];
export type JobOffer = Schemas["JobOffer"];
export type JobOfferPage = Schemas["JobOfferPage"];
export type JobOfferStatus = Schemas["JobOfferStatus"];
export type TransitionAction = Schemas["TransitionAction"];
export type CreateJobOfferRequest = Schemas["CreateJobOfferRequest"];
export type UpdateJobOfferRequest = Schemas["UpdateJobOfferRequest"];
export type TransitionRequest = Schemas["TransitionRequest"];
export type AvailableTransitions = Schemas["AvailableTransitions"];
export type TransitionHistoryEntry = Schemas["TransitionHistoryEntry"];
export type CompanyConfiguration = Schemas["CompanyConfiguration"];
export type UpdateCompanyConfigurationRequest = Schemas["UpdateCompanyConfigurationRequest"];
export type ErrorResponse = Schemas["Error"];
export type ValidationError = Schemas["ValidationError"];
