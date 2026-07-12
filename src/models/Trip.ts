import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface ITrip extends Document {
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: Types.ObjectId;
  driverId: Types.ObjectId;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  startOdometer?: number;
  endOdometer?: number;
  fuelConsumed?: number;
  revenue?: number;
  status: TripStatus;
  dispatchedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    tripNumber: { type: String, required: true, unique: true },
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    cargoWeight: { type: Number, required: true, min: 0 },
    plannedDistance: { type: Number, required: true, min: 0 },
    actualDistance: { type: Number, min: 0 },
    startOdometer: { type: Number, min: 0 },
    endOdometer: { type: Number, min: 0 },
    fuelConsumed: { type: Number, min: 0 },
    revenue: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'], default: 'Draft' },
    dispatchedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

const Trip: Model<ITrip> = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
export default Trip;
