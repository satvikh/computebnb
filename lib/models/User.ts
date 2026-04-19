import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "consumer" | "producer";

export interface IUser extends Document {
  email?: string;
  username?: string;
  displayName?: string;
  role: UserRole;
  walletAddress?: string;
  walletSecretKey?: string;
  walletNetwork?: string;
  initialAirdropSignature?: string;
  totalSpentCents: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, trim: true, lowercase: true },
    username: { type: String, trim: true },
    displayName: { type: String, trim: true },
    walletAddress: { type: String, trim: true },
    walletSecretKey: { type: String, trim: true },
    walletNetwork: { type: String, trim: true },
    initialAirdropSignature: { type: String, trim: true },
    totalSpentCents: { type: Number, default: 0, min: 0 },
    role: {
      type: String,
      enum: ["consumer", "producer"],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
