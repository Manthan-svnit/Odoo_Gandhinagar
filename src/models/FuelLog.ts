import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFuelLog extends Document {
  vehicleId: Types.ObjectId;
  tripId?: Types.ObjectId;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  date: Date;
  odometer?: number;
  createdAt: Date;
}

const FuelLogSchema = new Schema<IFuelLog>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    liters: { type: Number, required: true, min: 0 },
    costPerLiter: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    odometer: { type: Number, min: 0 },
  },
  { timestamps: true }
);

const FuelLog: Model<IFuelLog> = mongoose.models.FuelLog || mongoose.model<IFuelLog>('FuelLog', FuelLogSchema);
export default FuelLog;
