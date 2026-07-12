import mongoose, { Schema, Document, Model } from 'mongoose';

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface IDriver extends Document {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  email?: string;
  safetyScore: number;
  tripsCompleted: number;
  status: DriverStatus;
  pendingSuspension?: boolean;
  lastExpiryReminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseCategory: { type: String, required: true, trim: true },
    licenseExpiryDate: { type: Date, required: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    safetyScore: { type: Number, required: true, min: 0, max: 100, default: 100 },
    tripsCompleted: { type: Number, default: 0 },
    status: { type: String, enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'], default: 'Available' },
    pendingSuspension: { type: Boolean, default: false },
    lastExpiryReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

const Driver: Model<IDriver> = mongoose.models.Driver || mongoose.model<IDriver>('Driver', DriverSchema);
export default Driver;
