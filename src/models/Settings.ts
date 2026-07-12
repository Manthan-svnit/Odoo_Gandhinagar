import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    depotName: { type: String, default: 'Gandhinagar Depot GJ4' },
    currency: { type: String, default: 'INR (₹)' },
    distanceUnit: { type: String, default: 'Kilometers' },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
export default Settings;
