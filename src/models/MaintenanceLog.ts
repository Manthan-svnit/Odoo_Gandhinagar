import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MaintenanceStatus = 'Active' | 'Closed';

export interface IMaintenanceLog extends Document {
  vehicleId: Types.ObjectId;
  serviceType: string;
  description?: string;
  cost: number;
  date: Date;
  closedAt?: Date;
  status: MaintenanceStatus;
  createdAt: Date;
}

const MaintenanceLogSchema = new Schema<IMaintenanceLog>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    serviceType: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    cost: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  },
  { timestamps: true }
);

const MaintenanceLog: Model<IMaintenanceLog> =
  mongoose.models.MaintenanceLog || mongoose.model<IMaintenanceLog>('MaintenanceLog', MaintenanceLogSchema);
export default MaintenanceLog;
