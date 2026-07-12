import mongoose, { Schema, Document, Model } from 'mongoose';

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type VehicleType = 'Truck' | 'Van' | 'Mini' | 'Car' | 'Bike' | 'Other';

export interface IVehicle extends Omit<Document, 'model'> {
  registrationNumber: string;
  name: string;
  model: string;
  type: VehicleType;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Truck', 'Van', 'Mini', 'Car', 'Bike', 'Other'], required: true },
    maxLoadCapacity: { type: Number, required: true, min: 0 },
    odometer: { type: Number, required: true, min: 0, default: 0 },
    acquisitionCost: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Available', 'On Trip', 'In Shop', 'Retired'], default: 'Available' },
  },
  { timestamps: true }
);

const Vehicle: Model<IVehicle> = mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);
export default Vehicle;
