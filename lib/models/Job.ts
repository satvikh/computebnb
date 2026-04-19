import mongoose, { Schema, Document, Model } from "mongoose";

export type JobStatus = "queued" | "assigned" | "running" | "completed" | "failed";
export type JobType = "text_generation" | "image_caption" | "embedding" | "shell_demo";

export interface IJob extends Document {
  title: string;
  type: JobType;
  status: JobStatus;
  input: string;
  result?: string;
  error?: string;
  failureReason?: string;
  budgetCents: number;
  assignedProviderId?: string;
  retryCount: number;
  startedAt?: Date;
  completedAt?: Date;
  actualRuntimeSeconds?: number;
  jobCostCents?: number;
  providerPayoutCents?: number;
  platformFeeCents?: number;
  proofHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["text_generation", "image_caption", "embedding", "shell_demo"],
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "assigned", "running", "completed", "failed"],
      default: "queued",
    },
    input: { type: String, required: true },
    result: { type: String },
    error: { type: String },
    failureReason: { type: String },
    budgetCents: { type: Number, default: 500 },
    assignedProviderId: { type: String },
    retryCount: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    actualRuntimeSeconds: { type: Number },
    jobCostCents: { type: Number },
    providerPayoutCents: { type: Number },
    platformFeeCents: { type: Number },
    proofHash: { type: String },
  },
  { timestamps: true }
);

const Job: Model<IJob> =
  mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

export default Job;
