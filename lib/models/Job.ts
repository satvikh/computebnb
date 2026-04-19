import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface IJob extends Document {
  consumerUserId: Types.ObjectId;
  machineId: Types.ObjectId;
  status: JobStatus;
  code: string;
  filename?: string;
  timeoutSeconds?: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  budgetCents: number;
  jobCostCents?: number | null;
  providerPayoutCents?: number | null;
  platformFeeCents?: number | null;
  solanaPaymentLamports?: number | null;
  solanaPaymentSignature?: string | null;
  solanaPaymentStatus?: "pending" | "settled" | "failed";
  solanaCentsPerSol?: number | null;
  actualRuntimeSeconds?: number | null;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    consumerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    machineId: {
      type: Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    code: { type: String, required: true },
    filename: { type: String, trim: true },
    timeoutSeconds: { type: Number, min: 1 },
    stdout: { type: String, default: "" },
    stderr: { type: String, default: "" },
    exitCode: { type: Number, default: null },
    budgetCents: { type: Number, default: 500, min: 1 },
    jobCostCents: { type: Number, min: 0, default: null },
    providerPayoutCents: { type: Number, min: 0, default: null },
    platformFeeCents: { type: Number, min: 0, default: null },
    solanaPaymentLamports: { type: Number, min: 0, default: null },
    solanaPaymentSignature: { type: String, default: null },
    solanaPaymentStatus: {
      type: String,
      enum: ["pending", "settled", "failed"],
      default: "pending",
    },
    solanaCentsPerSol: { type: Number, min: 1, default: null },
    actualRuntimeSeconds: { type: Number, min: 0, default: null },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "jobs",
  }
);

JobSchema.index({ machineId: 1, status: 1, createdAt: 1 });
JobSchema.index({ consumerUserId: 1, createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });

const Job: Model<IJob> =
  mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

export default Job;
