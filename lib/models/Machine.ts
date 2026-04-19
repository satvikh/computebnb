import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { DEFAULT_MACHINE_HOURLY_RATE_CENTS } from "@/lib/payment-config";

export type MachineStatus = "active" | "inactive" | "busy";

export interface IMachine extends Document {
  producerUserId: Types.ObjectId;
  name: string;
  cpu: string;
  gpu: string;
  ramGb: number;
  status: MachineStatus;
  hourlyRateCents: number;
  totalEarnedCents: number;
  walletAddress?: string;
  walletSecretKey?: string;
  walletNetwork?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MachineSchema = new Schema<IMachine>(
  {
    producerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    cpu: { type: String, required: true, trim: true },
    gpu: { type: String, required: true, trim: true },
    ramGb: { type: Number, required: true, min: 1 },
    hourlyRateCents: { type: Number, default: DEFAULT_MACHINE_HOURLY_RATE_CENTS, min: 1 },
    totalEarnedCents: { type: Number, default: 0, min: 0 },
    walletAddress: { type: String, trim: true },
    walletSecretKey: { type: String, trim: true },
    walletNetwork: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "busy"],
      default: "inactive",
    },
  },
  {
    timestamps: true,
    collection: "machines",
  }
);

MachineSchema.index({ producerUserId: 1, createdAt: -1 });
MachineSchema.index({ status: 1, createdAt: -1 });
MachineSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });

const Machine: Model<IMachine> =
  mongoose.models.Machine || mongoose.model<IMachine>("Machine", MachineSchema);

export default Machine;
