import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ExpenseCategory = 'Toll' | 'Maintenance' | 'Fuel' | 'Other';

export interface IExpense extends Document {
  vehicleId?: Types.ObjectId;
  tripId?: Types.ObjectId;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    category: { type: String, enum: ['Toll', 'Maintenance', 'Fuel', 'Other'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
