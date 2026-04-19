import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IJobEvent extends Document {
  jobId: Types.ObjectId;
  machineId?: Types.ObjectId;
  type: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobEventSchema = new Schema<IJobEvent>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    machineId: { type: Schema.Types.ObjectId, ref: "Machine" },
    type: { type: String, required: true, trim: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

JobEventSchema.index({ jobId: 1, createdAt: -1 });
JobEventSchema.index({ machineId: 1, createdAt: -1 });
JobEventSchema.index({ createdAt: -1 });

const JobEvent: Model<IJobEvent> =
  mongoose.models.JobEvent || mongoose.model<IJobEvent>("JobEvent", JobEventSchema);

export default JobEvent;
